import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { compareDesc } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ChatAssignment, Chats, FetchAllChat, ExecutiveStatusUpdate, Message, TagUpdate } from '../../../../app/models/chat.model';
import { ChatService } from '../../../../app/service/chat.service';
import { PySmartChatService } from '../../../../app/service/py-smart-chat.service';
import { SharedService } from '../../../service/shared.service';
import { SlaTimerComponent } from '../../../../app/components/sla-timer/sla-timer.component';

@Component({
  selector: 'app-chat-number-list',
  standalone: true,
  imports: [NgTemplateOutlet, CommonModule, FormsModule, SlaTimerComponent],
  templateUrl: './chat-number-list.component.html',
  styleUrl: './chat-number-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatNumberListComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('chatScrollContainer') chatScrollContainer!: ElementRef;

  /** customer_type value sent in fetchAllChat request. '' means no filter (Partner). */
  @Input() customerType: string = '';

  /** Whether to show the dropdown filter (Partner only). */
  @Input() showFilter: boolean = false;

  /** Date format for chat list time display. 'HH:mm' for Partner, 'shortTime' for others. */
  @Input() dateFormat: string = 'HH:mm';

  /** Whether to show customer_name alongside customer number (Partner only). */
  @Input() showCustomerName: boolean = false;

  private destroyRef = inject(DestroyRef);

  @Output() chatSelected = new EventEmitter<any>();
  @Output() dropdownSelected: EventEmitter<{ status: boolean; value: string }> = new EventEmitter();

  constructor(
    private chatService: ChatService,
    private pscs: PySmartChatService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  errorMessage: string = '';
  selectedChat: any = null;
  fetchAllChatData: FetchAllChat | null = null;
  allChats: Chats[] = [];   // Master unfiltered list
  chats: Chats[] = [];      // Filtered display list
  currentPage: number = 1;
  totalPages: number = 0;
  isLoading: boolean = false;
  isFresh = true;
  selectedFilter: string = '';

  mobileNumber: string | null = null;

  // Online Executives (Step 5)
  onlineExecutives: ExecutiveStatusUpdate[] = [];

  // My Chats / All Chats Tabs (Step 6)
  activeTab: 'my' | 'all' = 'all';
  executiveId: string | null = null;

  // Search + Filter (Phase 2 Step 1)
  searchQuery: string = '';
  statusFilter: 'active' | 'pending' = 'active';
  typeFilter: string = 'All';
  activeCount: number = 0;
  pendingCount: number = 0;

  // Periodic refresh fallback — poll every 15s to keep list fresh in case
  // room_update events are missed due to network issues.
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 15_000;

  // Track whether ngOnInit has run (to skip first ngOnChanges which fires before ngOnInit)
  private initialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    // When customerType input changes after initial load (navigation between stakeholder pages),
    // reset the chat list and re-fetch for the new stakeholder type.
    if (changes['customerType'] && !changes['customerType'].firstChange && this.initialized) {
      console.log('[ChatList] customerType changed:', changes['customerType'].previousValue, '→', changes['customerType'].currentValue);
      this.allChats = [];
      this.chats = [];
      this.selectedChat = null;
      this.currentPage = 1;
      this.totalPages = 0;
      this.isFresh = true;
      this.isLoading = false;
      this.searchQuery = '';
      this.statusFilter = 'active';
      this.typeFilter = 'All';
      this.activeCount = 0;
      this.pendingCount = 0;
      this.hasRealCounts = false;

      // Re-join the correct socket room for the new stakeholder type
      this.joinCustomerTypeRoom();
      // Fetch chats for the new stakeholder type
      this.fetchAllChat();
      this.cdr.markForCheck();
    }
  }

  ngOnInit() {
    // Extract executive_id from localStorage (Step 6)
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      if (rawData) {
        try {
          const loginData = JSON.parse(rawData);
          this.executiveId = loginData?.executive_id || null;
        } catch (e) {
          console.error('Failed to parse login details:', e);
        }
      }
    }

    // Subscribe to fetch_all_chats response ONCE (Bug fix: was inside fetchAllChat causing duplicates)
    this.chatService.onFetchAllChatsResponse()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: FetchAllChat) => {
        console.log('fetchAllChat response:', JSON.stringify(response));
        if (response.status === 1) {
          const chats = (Array.isArray(response.chats) ? response.chats : [])
            .map((c: any) => this.normalizeChat(c));
          if (this.isFresh) {
            this.allChats = chats;
          } else {
            this.allChats = [...this.allChats, ...chats];
          }
          this.totalPages = response.pagination?.total_pages ?? 0;
          // Use counts from backend response
          if (response.pagination?.total_active !== undefined) {
            this.activeCount = response.pagination.total_active;
            this.pendingCount = response.pagination.total_pending ?? 0;
            this.hasRealCounts = true;
          } else {
            this.computeCounts();
          }
          this.filterChats();
        } else {
          this.errorMessage = response.message || 'An error occurred';
          console.log('fetchAllChat error:', JSON.stringify(response));
        }
        this.isLoading = false;
        this.isFresh = false;
        this.cdr.markForCheck();
      });

    // Subscribe to search_chat response ONCE (Bug fix: was inside search_chat causing duplicates)
    this.chatService.search_chat_response()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: FetchAllChat) => {
        console.log('search_chat response:', JSON.stringify(response));
        if (response.status === 1) {
          // Backend returns `chat` (singular) or `chats` (array) — handle both
          let rawChats: any[];
          if (Array.isArray((response as any).chats)) {
            rawChats = (response as any).chats;
          } else if ((response as any).chat) {
            rawChats = [( response as any).chat];
          } else {
            rawChats = [];
          }
          const chats = rawChats.map((c: any) => this.normalizeChat(c));
          this.allChats = chats;
          this.totalPages = response.pagination?.total_pages ?? 0;
          // Show all search results regardless of active/resolved filter
          this.chats = chats;
          this.activeCount = chats.filter(c => c.status !== 'resolved' && c.is_resolved !== true).length;
          this.pendingCount = chats.filter(c => c.status === 'resolved' || c.is_resolved === true).length;
        } else {
          this.errorMessage = response.message || 'An error occurred';
        }
        this.isLoading = false;
        this.isFresh = false;
        this.cdr.markForCheck();
      });

    // Join the customer-type socket room to receive room_update broadcasts
    this.joinCustomerTypeRoom();

    // Subscribe to room_update ONCE for all pages (real-time chat list updates)
    this.onRoomUpdate();

    if (this.showFilter) {
      // Partner: subscribe to SharedService for mobile search
      this.sharedService.currentMobileNumber$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(mobile => {
        this.mobileNumber = mobile;
        if (this.mobileNumber) {
          this.search_chat();
        } else {
          this.fetchAllChat();
        }
      });
    } else {
      // Customer/Vendor/SRDP: just fetch
      this.fetchAllChat();
    }

    // Subscribe to new_message as fallback for chat list updates
    // (in case room_update_* events are not received)
    this.chatService.onNewMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message: Message) => {
        console.log('[ChatList] new_message event received:', (message as any).chat_id, message.message?.substring(0, 30));
        this.handleNewMessageForChatList(message);
      });

    // Subscribe to executive status updates (Step 5)
    this.chatService.onExecutiveStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: ExecutiveStatusUpdate) => {
        if (update.status === 'ONLINE') {
          // Add executive if not already in list
          const exists = this.onlineExecutives.find(e => e.executive_id === update.executive_id);
          if (!exists) {
            this.onlineExecutives = [...this.onlineExecutives, update];
          }
        } else {
          // Remove executive from online list
          this.onlineExecutives = this.onlineExecutives.filter(e => e.executive_id !== update.executive_id);
        }
        this.cdr.markForCheck();
      });

    // Subscribe to chat assignment events (Phase 3 Step 1)
    const handleAssignment = (assignment: ChatAssignment) => {
      const chat = this.allChats?.find(c => c.chat_id === assignment.chat_id);
      if (chat) {
        chat.assigned_executive_id = assignment.executive_id;
        chat.assigned_executive_name = assignment.executive_name;
        this.filterChats();
        this.cdr.markForCheck();
      }
    };

    this.chatService.onChatAssigned()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(handleAssignment);

    this.chatService.onChatReassigned()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(handleAssignment);

    // Subscribe to tag updates (Phase 3 Step 3)
    this.chatService.onTagUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: TagUpdate) => {
        const chat = this.allChats?.find(c => c.chat_id === update.chat_id);
        if (chat) {
          if (update.tags) {
            // V1 format: full tags array
            chat.tags = update.tags;
          } else if (update.tag && update.action) {
            // V2 format: single tag delta { tag, action: "add"|"remove" }
            const currentTags: string[] = chat.tags || [];
            if (update.action === 'add' && !currentTags.includes(update.tag)) {
              chat.tags = [...currentTags, update.tag];
            } else if (update.action === 'remove') {
              chat.tags = currentTags.filter((t: string) => t !== update.tag);
            }
          }
          this.filterChats();
          this.cdr.markForCheck();
        }
      });

    // Start periodic refresh as fallback for missed room_update events.
    this.startPeriodicRefresh();

    this.initialized = true;
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // ===== Search + Filter Methods (Phase 2 Step 1) =====

  /** Block digit keypress when search already has 10 digits (prevents typing) */
  onSearchKeydown(event: KeyboardEvent): void {
    // Allow control keys: backspace, delete, arrow keys, tab, etc.
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    // Allow Ctrl/Cmd combinations (copy, paste, select all)
    if (event.ctrlKey || event.metaKey) return;

    // If current value is all digits and already 10, block any new digit
    if (/^\d{10}$/.test(this.searchQuery) && /^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onSearchInput(): void {
    // Fallback: truncate if pasted value exceeds 10 digits
    if (/^\d+$/.test(this.searchQuery) && this.searchQuery.length > 10) {
      this.searchQuery = this.searchQuery.slice(0, 10);
    }
    this.filterChats();
  }

  filterChats(): void {
    let filtered = [...this.allChats];

    // Active/Pending tab filter — mutually exclusive
    if (this.statusFilter === 'pending') {
      filtered = filtered.filter(c => c.tags && c.tags.includes('Awaiting Customer Response'));
    } else {
      // 'active' = not resolved AND not awaiting customer response
      filtered = filtered.filter(c =>
        c.status !== 'resolved' && c.is_resolved !== true &&
        !(c.tags && c.tags.includes('Awaiting Customer Response'))
      );
    }

    // Type filter
    if (this.typeFilter !== 'All') {
      filtered = filtered.filter(c => c.customer_type === this.typeFilter);
    }

    // Search query (mobile number or name)
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.customer && c.customer.toLowerCase().includes(q)) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(q))
      );
    }

    this.chats = filtered;
    this.cdr.markForCheck();
  }

  setStatusFilter(status: 'active' | 'pending'): void {
    this.statusFilter = status;
    this.filterChats();
  }

  setTypeFilter(type: string): void {
    this.typeFilter = type;
    this.filterChats();
  }

  private hasRealCounts = false;

  private computeCounts(): void {
    // Skip local counts if real backend counts already loaded
    if (this.hasRealCounts) return;
    this.activeCount = this.allChats.filter(c => c.status !== 'resolved' && c.is_resolved !== true).length;
    this.pendingCount = this.allChats.filter(c => c.tags && c.tags.includes('Awaiting Customer Response')).length;
  }

  // ===== Existing Methods =====

  onChatListScroll(): void {
    const container = this.chatScrollContainer?.nativeElement;
    if (!container) return;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // Trigger load when within 100px of the bottom
    if (scrollBottom < 100 && !this.isLoading && this.currentPage < this.totalPages) {
      this.loadFetchAllChat();
    }
  }

  loadFetchAllChat() {
    this.currentPage++;
    this.isFresh = false;
    this.fetchAllChat();
  }

  onFilterChange(event: any): void {
    this.dropdownSelected.emit({ status: true, value: event.target.value });
    this.allChats = [];
    this.chats = [];
    this.currentPage = 1;
    this.totalPages = 0;
    this.isFresh = true;
    // Reset counts — use local counts from filtered results
    this.hasRealCounts = false;
    this.activeCount = 0;
    this.pendingCount = 0;
    this.fetchAllChat();
  }

  // My Chats / All Chats tab switching (Step 6)
  switchTab(tab: 'my' | 'all'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.allChats = [];
    this.chats = [];
    this.currentPage = 1;
    this.totalPages = 0;
    this.isFresh = true;
    this.fetchAllChat();
  }

  public search_chat() {
    // Reset state for fresh search
    this.allChats = [];
    this.chats = [];
    this.currentPage = 1;
    this.totalPages = 0;
    this.isFresh = true;
    this.isLoading = true;
    this.cdr.markForCheck();

    let agentNumber = null;
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      const data = rawData ? JSON.parse(rawData) : null;
      if (data && data.agentNumber) {
        agentNumber = data.agentNumber;
      }
    }

    let req = {
      sender: agentNumber,
      customer: this.mobileNumber,
      customer_type: this.customerType || undefined,
    };
    console.log('search_chat request:', req);

    this.chatService.search_chat(req);
  }

  public fetchAllChat() {
    if (this.isLoading || (this.totalPages && this.currentPage > this.totalPages)) {
      return;
    }

    let agentNumber = null;
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      const data = rawData ? JSON.parse(rawData) : null;
      if (data && data.agentNumber) {
        agentNumber = data.agentNumber;
      }
    }
    this.isLoading = true;

    // Build request — add customer_type only when customerType input is non-empty
    let req: any = {
      sender: agentNumber, page: this.currentPage, page_size: 20,
      ...(this.selectedFilter !== '' && { user_status: this.selectedFilter })
    };

    if (this.customerType !== '') {
      req.customer_type = this.customerType;
    }

    // My Chats tab: filter by assigned executive (Step 6)
    if (this.activeTab === 'my' && this.executiveId) {
      req.assigned_executive_id = this.executiveId;
    }

    console.log('fetchAllChat request:', req);

    this.chatService.fetchAllChatUser(req);
    // Subscription is in ngOnInit — no duplicate here
  }

  onRoomUpdate() {
    this.chatService.onRoomUpdate().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((rawChat: Chats) => {
      // Skip room updates when a search is active to avoid polluting search results
      if (this.mobileNumber) {
        return;
      }

      // Normalize V2 fields to frontend field names
      const chat = this.normalizeChat(rawChat);
      console.log('New onRoomUpdate received:', chat);

      // Filter: ignore updates for a different customer type
      if (this.customerType && chat.customer_type && chat.customer_type !== this.customerType) {
        console.log('[ChatList] Ignoring room_update for different type:', chat.customer_type, 'expected:', this.customerType);
        return;
      }

      const room = this.allChats?.find((r) => r.chat_id === chat.chat_id);
      if (room) {
        room.last_message = chat.last_message;
        room.last_message_time = chat.last_message_time;

        // Null check from Vendor variant — prevents crash when no chat is selected
        if (this.selectedChat == null || this.selectedChat.chat_id != room.chat_id)
          room.unseen_count++;

        // V2 sends last_interaction_by; V1 sends last_msg_by — handle both
        const lastBy = chat.last_msg_by || chat.last_interaction_by;
        if (lastBy) {
          room.last_msg_by = lastBy;
          room.last_interaction_by = lastBy;
        }

        // Update last_incoming_message_time when message is from Customer
        // This resets the SLA timer on new customer messages
        if (chat.last_incoming_message_time) {
          room.last_incoming_message_time = chat.last_incoming_message_time;
        } else if (lastBy === 'Customer') {
          room.last_incoming_message_time = chat.last_message_time;
        }

        if (this.allChats?.length) {
          this.allChats = [...this.allChats].sort((a, b) => {
            try {
              return compareDesc(this.parseDateTime(a.last_message_time), this.parseDateTime(b.last_message_time));
            } catch { return 0; }
          });
        }

        this.filterChats();
      } else if (!this.selectedFilter) {
        // New chat not in list — add only when no dropdown filter is active
        // (can't verify filter match locally, silentRefresh will pick it up)
        this.allChats = [chat, ...this.allChats];
        this.filterChats();
      }
      this.cdr.markForCheck();
    });
  }

  onChatClick(chat: any) {
    this.selectedChat = chat;

    if (this.showFilter) {
      // Partner: emit with selectedFilter for DCO panel routing
      this.chatSelected.emit({ selectedChatData: chat, selectedFilter: this.selectedFilter });
    } else {
      // Customer/Vendor/SRDP: emit plain chat object
      this.chatSelected.emit(chat);
    }
  }

  updateUnSeenCount(chat_id: any, count: any) {
    const room = this.allChats?.find((r) => r.chat_id === chat_id);
    if (room) {
      room.unseen_count = count;
      this.filterChats();
    }
  }

  removeResolveChat(chat_id: any) {
    const index = this.allChats?.findIndex((r) => r.chat_id === chat_id);
    if (index !== -1) {
      this.allChats.splice(index, 1);
      this.computeCounts();
      this.filterChats();
    }
  }

  /**
   * Join the appropriate socket room based on customerType so we receive
   * room_update / room_update_customer / room_update_vendor / room_update_srdp broadcasts.
   */
  private currentRoom: string | null = null;

  private joinCustomerTypeRoom(): void {
    // Map customerType input → V2 socket room name
    const roomMap: Record<string, string> = {
      '': 'PartnerApp',
      'Customer': 'CustomerApp',
      'Partner': 'PartnerApp',
      'Vendor': 'VendorApp',
      'SRDP': 'SRDPApp',
    };
    const room = roomMap[this.customerType] || 'PartnerApp';

    // Leave old room first to prevent cross-type updates
    if (this.currentRoom && this.currentRoom !== room) {
      this.chatService.leaveRoom(this.currentRoom);
    }

    console.log('Joining socket room:', room, 'for customerType:', this.customerType);
    this.chatService.joinRoom(room);
    this.currentRoom = room;
  }

  /**
   * Start periodic silent refresh of the chat list.
   * Backend has no `join_room` handler, so `room_update_*` broadcasts are never
   * received. This polling ensures the list stays reasonably fresh (every 30s).
   * Pauses when the tab is not visible to save bandwidth.
   */
  private startPeriodicRefresh(): void {
    if (this.refreshInterval) return;
    this.refreshInterval = setInterval(() => {
      // Skip if tab is hidden (saves bandwidth)
      if (document.hidden) return;
      // Skip if already loading (prevent overlapping requests)
      if (this.isLoading) return;
      // Skip if a mobile search is active (don't overwrite search results)
      if (this.mobileNumber) return;
      console.log('[ChatList] periodic refresh triggered');
      this.silentRefresh();
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Silently re-fetch page 1 of the chat list to pick up new messages.
   * Unlike fetchAllChat(), this always resets to page 1 and replaces the list.
   */
  private silentRefresh(): void {
    let agentNumber = null;
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      const data = rawData ? JSON.parse(rawData) : null;
      if (data?.agentNumber) {
        agentNumber = data.agentNumber;
      }
    }

    const req: any = {
      sender: agentNumber,
      page: 1,
      page_size: 20,
      ...(this.selectedFilter !== '' && { user_status: this.selectedFilter }),
    };

    if (this.customerType !== '') {
      req.customer_type = this.customerType;
    }

    if (this.activeTab === 'my' && this.executiveId) {
      req.assigned_executive_id = this.executiveId;
    }

    // Set flags so the response handler replaces (not appends)
    this.currentPage = 1;
    this.isFresh = true;
    this.isLoading = true;

    this.chatService.fetchAllChatUser(req);
  }

  /**
   * Normalize a V2 backend chat object to the field names used by the frontend template.
   * V2 field changes:
   *   _id → chat_id
   *   last_incoming_message → last_incoming_message_time (for SLA timer)
   *   last_interaction_by → last_msg_by (V1 compat)
   *   is_resolved → status mapping
   */
  private normalizeChat(raw: any): Chats {
    return {
      ...raw,
      chat_id: raw.chat_id || raw._id,
      // V2 sends last_incoming_message; SLA timer binds to last_incoming_message_time
      // Fallback chain: last_incoming_message_time → last_incoming_message → last_message_time
      last_incoming_message_time: raw.last_incoming_message_time || raw.last_incoming_message || raw.last_message_time || null,
      // V2 sends last_interaction_by; some V1 code reads last_msg_by
      last_msg_by: raw.last_msg_by || raw.last_interaction_by || null,
      last_interaction_by: raw.last_interaction_by || raw.last_msg_by || null,
      // Ensure unseen_count defaults to 0 (V2 only includes when sender is provided)
      unseen_count: raw.unseen_count ?? 0,
      // Ensure tags is always an array
      tags: Array.isArray(raw.tags) ? raw.tags : [],
    } as Chats;
  }

  /**
   * When a new_message event fires, update the matching chat in the list
   * with the new message preview and re-sort. This is a fallback in case
   * room_update_* events are not received (e.g., if the server doesn't
   * auto-join the socket to the customer-type room).
   */
  private handleNewMessageForChatList(message: Message): void {
    // Skip when search is active to avoid polluting search results
    if (this.mobileNumber) return;

    const chatId = (message as any).chat_id;
    console.log('[ChatList] handleNewMessage:', chatId, 'message:', message.message?.substring(0, 30), 'allChats:', this.allChats?.length);
    if (!chatId) return;

    const room = this.allChats?.find((r) => r.chat_id === chatId);
    console.log('[ChatList] room found:', !!room, room ? room.customer : 'N/A');
    if (room) {
      room.last_message = message.message;
      room.last_message_time = message.datetime;

      // V2 uses sender_type; normalize
      const senderType = message.type || (message as any).sender_type || 'Customer';
      room.last_msg_by = senderType;
      room.last_interaction_by = senderType;

      // Update last_incoming_message_time for SLA timer reset on customer messages
      if (senderType === 'Customer') {
        room.last_incoming_message_time = message.datetime;
      }

      // Increment unseen count if this chat is not the currently selected one
      if (this.selectedChat == null || this.selectedChat.chat_id !== room.chat_id) {
        room.unseen_count++;
      }

      // Re-sort so most recent chat appears at top
      if (this.allChats?.length) {
        this.allChats = [...this.allChats].sort((a, b) => {
          try {
            return compareDesc(this.parseDateTime(a.last_message_time), this.parseDateTime(b.last_message_time));
          } catch { return 0; }
        });
      }

      this.computeCounts();
      this.filterChats();
      this.cdr.markForCheck();
    } else if (!this.selectedFilter) {
      // Chat not in list — only re-fetch when no dropdown filter is active
      this.currentPage = 1;
      this.isFresh = true;
      this.isLoading = false;
      this.fetchAllChat();
    }
  }

  /** Format chat list time in IST to avoid UTC/IST mismatch */
  formatChatTime(timestamp: string): string {
    if (!timestamp) return '';
    try {
      return formatInTimeZone(this.parseDateTime(timestamp), 'Asia/Kolkata', 'hh:mm a');
    } catch {
      return '';
    }
  }

  /**
   * Parse a datetime string into a Date, treating ambiguous (no timezone) strings as UTC.
   * MongoDB stores UTC; backend may return strings without 'Z' or offset.
   */
  private parseDateTime(dt: string): Date {
    if (!dt) return new Date();
    // If already has timezone info ('Z', '+05:30', '-04:00'), parse directly
    if (/Z$/.test(dt) || /[+-]\d{2}:\d{2}$/.test(dt) || /[+-]\d{4}$/.test(dt)) {
      return new Date(dt);
    }
    // Ambiguous: treat as UTC by normalizing to ISO + 'Z'
    return new Date(dt.replace(' ', 'T') + 'Z');
  }

}

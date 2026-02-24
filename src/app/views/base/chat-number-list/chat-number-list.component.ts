import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { compareDesc, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ChatAssignment, Chats, FetchAllChat, ExecutiveStatusUpdate, Message, TagUpdate } from '../../../../app/models/chat.model';
import { ChatService } from '../../../../app/service/chat.service';
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
export class ChatNumberListComponent implements OnInit {

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
  activeTab: 'my' | 'all' = 'my';
  executiveId: string | null = null;

  // Search + Filter (Phase 2 Step 1)
  searchQuery: string = '';
  statusFilter: 'active' | 'resolved' = 'active';
  typeFilter: string = 'All';
  activeCount: number = 0;
  resolvedCount: number = 0;

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
          this.computeCounts();
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
          const chats = (Array.isArray(response.chats) ? response.chats : [])
            .map((c: any) => this.normalizeChat(c));
          if (this.isFresh) {
            this.allChats = chats;
          } else {
            this.allChats = [...this.allChats, ...chats];
          }
          this.totalPages = response.pagination?.total_pages ?? 0;
          this.computeCounts();
          this.filterChats();
        } else {
          this.errorMessage = response.message || 'An error occurred';
        }
        this.isLoading = false;
        this.isFresh = false;
        this.cdr.markForCheck();
      });

    // Join the customer-type socket room to receive room_update broadcasts
    this.joinCustomerTypeRoom();

    if (this.showFilter) {
      // Partner: subscribe to SharedService for mobile search
      this.sharedService.currentMobileNumber$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(mobile => {
        this.mobileNumber = mobile;
        if (this.mobileNumber) {
          this.search_chat();
        } else {
          this.fetchAllChat();
          this.onRoomUpdate();
        }
      });
    } else {
      // Customer/Vendor/SRDP: just fetch and listen for updates
      this.fetchAllChat();
      this.onRoomUpdate();
    }

    // Subscribe to new_message as fallback for chat list updates
    // (in case room_update_* events are not received)
    this.chatService.onNewMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message: Message) => {
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
  }

  // ===== Search + Filter Methods (Phase 2 Step 1) =====

  filterChats(): void {
    let filtered = [...this.allChats];

    // Status filter
    if (this.statusFilter === 'resolved') {
      filtered = filtered.filter(c => c.status === 'resolved' || c.is_resolved === true);
    } else {
      // 'active' shows everything that is NOT explicitly resolved
      filtered = filtered.filter(c => c.status !== 'resolved' && c.is_resolved !== true);
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

  setStatusFilter(status: 'active' | 'resolved'): void {
    this.statusFilter = status;
    this.filterChats();
  }

  setTypeFilter(type: string): void {
    this.typeFilter = type;
    this.filterChats();
  }

  private computeCounts(): void {
    this.activeCount = this.allChats.filter(c => c.status !== 'resolved' && c.is_resolved !== true).length;
    this.resolvedCount = this.allChats.filter(c => c.status === 'resolved' || c.is_resolved === true).length;
  }

  // ===== Existing Methods =====

  loadFetchAllChat() {
    this.currentPage++;
    this.isFresh = false;
    this.fetchAllChat();
  }

  onFilterChange(event: any): void {
    this.dropdownSelected.emit({ status: true, value: event.target.value });
    this.allChats = [];
    this.chats = [];
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

    let req = {
      sender: agentNumber, customer: this.mobileNumber,
    };
    console.log(req);

    this.chatService.search_chat(req);
    // Subscription is in ngOnInit — no duplicate here
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
      ...(this.selectedFilter !== '' && { search: this.selectedFilter })
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
      // Normalize V2 fields to frontend field names
      const chat = this.normalizeChat(rawChat);
      console.log('New onRoomUpdate received:', chat);

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
              return compareDesc(parseISO(a.last_message_time), parseISO(b.last_message_time));
            } catch { return 0; }
          });
        }

        this.computeCounts();
        this.filterChats();
      } else {
        // New chat not in list — add it directly from the room_update payload
        // instead of re-fetching (which may be blocked by isLoading/pagination)
        this.allChats = [chat, ...this.allChats];
        this.computeCounts();
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
  private joinCustomerTypeRoom(): void {
    // Map customerType input → V2 socket room name
    const roomMap: Record<string, string> = {
      '': 'PartnerApp',
      'Customer': 'CustomerApp',
      'Partner': 'PartnerApp',
      'Vendor': 'VendorApp',
      'SRDP': 'SRDPApp',
      '9726724247': 'VendorApp',   // Vendor customerType from config
      '9586924247': 'SRDPApp',     // SRDP customerType from config
    };
    const room = roomMap[this.customerType] || 'PartnerApp';
    console.log('Joining socket room:', room, 'for customerType:', this.customerType);
    this.chatService.joinRoom(room);
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
      last_incoming_message_time: raw.last_incoming_message_time || raw.last_incoming_message || null,
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
    const chatId = (message as any).chat_id;
    if (!chatId) return;

    const room = this.allChats?.find((r) => r.chat_id === chatId);
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
            return compareDesc(parseISO(a.last_message_time), parseISO(b.last_message_time));
          } catch { return 0; }
        });
      }

      this.computeCounts();
      this.filterChats();
      this.cdr.markForCheck();
    } else {
      // Chat not in list — could be a brand new chat. Reset pagination and force fresh fetch.
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
      return formatInTimeZone(new Date(timestamp), 'Asia/Kolkata', 'hh:mm a');
    } catch {
      return '';
    }
  }

}

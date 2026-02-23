import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { compareDesc, parseISO } from 'date-fns';
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
  chats: Chats[] = [];
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
            .map((c: any) => ({ ...c, chat_id: c.chat_id || c._id }));
          if (this.isFresh) {
            this.chats = chats;
          } else {
            this.chats = [...this.chats, ...chats];
          }
          this.totalPages = response.pagination?.total_pages ?? 0;
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
            .map((c: any) => ({ ...c, chat_id: c.chat_id || c._id }));
          if (this.isFresh) {
            this.chats = chats;
          } else {
            this.chats = [...this.chats, ...chats];
          }
          this.totalPages = response.pagination?.total_pages ?? 0;
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
      const chat = this.chats?.find(c => c.chat_id === assignment.chat_id);
      if (chat) {
        chat.assigned_executive_id = assignment.executive_id;
        chat.assigned_executive_name = assignment.executive_name;
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
        const chat = this.chats?.find(c => c.chat_id === update.chat_id);
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
          this.cdr.markForCheck();
        }
      });
  }

  loadFetchAllChat() {
    this.currentPage++;
    this.isFresh = false;
    this.fetchAllChat();
  }

  onFilterChange(event: any): void {
    this.dropdownSelected.emit({ status: true, value: event.target.value });
    this.chats = [];
    this.fetchAllChat();
  }

  // My Chats / All Chats tab switching (Step 6)
  switchTab(tab: 'my' | 'all'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
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
      // V2 backend uses _id; map to chat_id for frontend compatibility
      const chat = { ...rawChat, chat_id: (rawChat as any).chat_id || (rawChat as any)._id } as Chats;
      console.log('New onRoomUpdate received:', chat);

      const room = this.chats?.find((r) => r.chat_id === chat.chat_id);
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

        if (this.chats?.length) {
          this.chats = [...this.chats].sort((a, b) => {
            try {
              return compareDesc(parseISO(a.last_message_time), parseISO(b.last_message_time));
            } catch { return 0; }
          });
        }

      } else {
        this.fetchAllChat();
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
    const room = this.chats?.find((r) => r.chat_id === chat_id);
    if (room) {
      room.unseen_count = count;
    }
  }

  removeResolveChat(chat_id: any) {
    const index = this.chats?.findIndex((r) => r.chat_id === chat_id);
    if (index !== -1) {
      this.chats.splice(index, 1);
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
   * When a new_message event fires, update the matching chat in the list
   * with the new message preview and re-sort. This is a fallback in case
   * room_update_* events are not received (e.g., if the server doesn't
   * auto-join the socket to the customer-type room).
   */
  private handleNewMessageForChatList(message: Message): void {
    const chatId = (message as any).chat_id;
    if (!chatId) return;

    const room = this.chats?.find((r) => r.chat_id === chatId);
    if (room) {
      room.last_message = message.message;
      room.last_message_time = message.datetime;

      // V2 uses sender_type; normalize
      const senderType = message.type || (message as any).sender_type || 'Customer';
      room.last_msg_by = senderType;
      room.last_interaction_by = senderType;

      // Increment unseen count if this chat is not the currently selected one
      if (this.selectedChat == null || this.selectedChat.chat_id !== room.chat_id) {
        room.unseen_count++;
      }

      // Re-sort so most recent chat appears at top
      if (this.chats?.length) {
        this.chats = [...this.chats].sort((a, b) => {
          try {
            return compareDesc(parseISO(a.last_message_time), parseISO(b.last_message_time));
          } catch { return 0; }
        });
      }

      this.cdr.markForCheck();
    } else {
      // Chat not in list — could be a brand new chat. Refresh the list.
      this.fetchAllChat();
    }
  }

}

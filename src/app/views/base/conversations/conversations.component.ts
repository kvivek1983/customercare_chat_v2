import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { compareDesc, format, isToday, isYesterday, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { ChatAssignment, Chats, Config, ExecutiveStatusUpdate, FetchAllChat, FetchAllChatByUser, Message, PREDEFINED_TAGS, ResponseData, RightPanelTab, TagUpdate } from '../../../../app/models/chat.model';
import { ChatTypeConfig, CHAT_TYPE_CONFIGS } from '../../../../app/models/chat-config.model';
import { ChatService } from '../../../../app/service/chat.service';
import { PySmartChatService } from '../../../../app/service/py-smart-chat.service';
import { DcoInfoComponent } from '../../../../app/views/base/dco-info/dco-info.component';
import { DcoSuspendViewComponent } from '../../../../app/views/base/dco-suspend-view/dco-suspend-view.component';
import { DcoPendingViewComponent } from '../dco-pending-view/dco-pending-view.component';
import { DcoActiveApprovedViewComponent } from '../dco-active-approved-view/dco-active-approved-view.component';
import { ChatNumberListComponent } from '../../../../app/views/base/chat-number-list/chat-number-list.component';
import { SlaTimerComponent } from '../../../../app/components/sla-timer/sla-timer.component';
import { RightPanelTabsComponent } from '../../../../app/components/right-panel-tabs/right-panel-tabs.component';
import { ContextHistoryPanelComponent } from '../../../../app/components/context-history-panel/context-history-panel.component';
import { RidesPanelComponent } from '../../../../app/components/rides-panel/rides-panel.component';
import { QuickActionsPanelComponent, QuickAction } from '../../../../app/components/quick-actions-panel/quick-actions-panel.component';
import { NotesPanelComponent } from '../../../../app/components/notes-panel/notes-panel.component';
import { TemplatePickerComponent } from '../../../../app/components/template-picker/template-picker.component';
import { WhatsAppTemplate } from '../../../../app/models/chat.model';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from '../../../service/shared.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [NgTemplateOutlet, CommonModule, FormsModule, ReactiveFormsModule, DcoInfoComponent, ChatNumberListComponent, SlaTimerComponent, RightPanelTabsComponent, ContextHistoryPanelComponent, RidesPanelComponent, QuickActionsPanelComponent, NotesPanelComponent, TemplatePickerComponent, DcoSuspendViewComponent, DcoPendingViewComponent, DcoActiveApprovedViewComponent],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationsComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('chatInput') chatInputRef!: ElementRef;
  @ViewChild(ChatNumberListComponent, { static: true }) chatNumberListComponent!: ChatNumberListComponent;

  private destroy$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);

  /** Configuration driven by route data customerType */
  config!: ChatTypeConfig;

  mobileForm: FormGroup;

  constructor(
    private chatService: ChatService,
    private pscs: PySmartChatService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {
    this.mobileForm = this.fb.group({
      mobileNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]]
    });
  }

  responseData: any = {};
  selectedChat: any = null;
  chats: any = [];
  isWhatsappChatOpen = 0;
  isChatInitiated = 0;
  agentNumber: any = null;
  openChat = false;
  dcoName: any = null;
  isResolved = false;

  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  isLoading = false;

  scrollThreshold: number = 50;
  isUserScrollingUp: boolean = false;

  // ChatGPT integration (Partner only)
  chatgptReply = false;
  private intervalId: any;
  custmore_msg: string[] = [];
  chatgptMessage: string = '';
  isLoader = false;
  private loaderInterval: any;
  private typingInterval: any;
  private dotLoader = '';

  // Timer handles for cleanup
  private navigateTimeout: any;

  // Blob URL tracking for revocation
  private blobUrls: string[] = [];

  // Single subscription for fetchChatsByUser response (prevent duplicates from shareReplay)
  private _fetchChatsSub: Subscription | null = null;

  // Loading delay (Partner only)
  loadingNewData = false;
  errorMessage: string = '';

  // DCO panel state (Partner only)
  dcoInfo: boolean = false;
  dcoSuspendView: boolean = false;
  dcoPendingView: boolean = false;
  dcoActiveApprovedView: boolean = false;
  chatNumber: string | undefined;
  selectedView: any;

  newMessage: string = '';

  // Chat Assignment (Phase 3 Step 1)
  assignedExecutiveName: string = '';
  showReassignDropdown: boolean = false;
  onlineExecutives: ExecutiveStatusUpdate[] = [];

  // Chat Tagging (Phase 3 Step 3)
  showTagSelector: boolean = false;

  // Post-Resolution Rating (Phase 3 Step 4)
  showRatingModal: boolean = false;
  pendingRating: number = 0;
  stars: number[] = [1, 2, 3, 4, 5];

  // Right Panel Tab State (Phase 4 Step 1)
  activeRightPanel: RightPanelTab = 'profile';

  // Template Picker State (Phase 4 Step 6)
  showTemplatePicker: boolean = false;

  ngOnInit() {
    // Read customerType from route data and look up config
    const customerType = this.route.snapshot.data['customerType'] || 'Partner';
    this.config = CHAT_TYPE_CONFIGS[customerType] || CHAT_TYPE_CONFIGS['Partner'];

    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      const data = rawData ? JSON.parse(rawData) : null;
      if (data && data.agentNumber) {
        this.agentNumber = data.agentNumber;
      }
    }
    this.onNewMessage();

    // Chat assignment subscriptions (Phase 3 Step 1)
    const handleAssignment = (assignment: ChatAssignment) => {
      if (this.selectedChat && this.selectedChat.chat_id === assignment.chat_id) {
        this.assignedExecutiveName = assignment.executive_name;
        this.selectedChat.assigned_executive_id = assignment.executive_id;
        this.selectedChat.assigned_executive_name = assignment.executive_name;
        this.cdr.markForCheck();
      }
    };

    this.chatService.onChatAssigned()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(handleAssignment);

    this.chatService.onChatReassigned()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(handleAssignment);

    // Track online executives for reassign dropdown
    this.chatService.onExecutiveStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: ExecutiveStatusUpdate) => {
        if (update.status === 'ONLINE') {
          const exists = this.onlineExecutives.find(e => e.executive_id === update.executive_id);
          if (!exists) {
            this.onlineExecutives = [...this.onlineExecutives, update];
          }
        } else {
          this.onlineExecutives = this.onlineExecutives.filter(e => e.executive_id !== update.executive_id);
        }
        this.cdr.markForCheck();
      });

    // Tag update subscription (Phase 3 Step 3)
    this.chatService.onTagUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update: TagUpdate) => {
        if (this.selectedChat && this.selectedChat.chat_id === update.chat_id) {
          this.selectedChat.tags = update.tags;
          this.cdr.markForCheck();
        }
      });

    // SLA alert subscription (Review Fix 1)
    this.chatService.onSlaAlert()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((alert: any) => {
        this.toastr.warning(
          `SLA breach on chat ${alert.chat_id}`,
          'SLA Alert',
          { timeOut: 10000 }
        );
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clear all timers
    if (this.navigateTimeout) clearTimeout(this.navigateTimeout);
    if (this.intervalId) clearTimeout(this.intervalId);
    if (this.loaderInterval) clearInterval(this.loaderInterval);
    if (this.typingInterval) clearInterval(this.typingInterval);

    // Revoke all blob URLs to prevent memory leaks
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls = [];
  }

  // --- Mobile Search (Partner + Vendor) ---

  searchMobile() {
    if (this.mobileForm.valid) {
      const mobile = this.mobileForm.value.mobileNumber;
      this.sharedService.setMobileNumber(mobile);
    } else {
      this.mobileForm.markAllAsTouched();
    }
  }

  clearMobile() {
    this.mobileForm.reset();
    this.sharedService.clearMobileNumber();
    if (this.config.showDcoPanels) {
      this.dcoInfo = false;
      this.dcoSuspendView = false;
      this.dcoPendingView = false;
      this.dcoActiveApprovedView = false;
    }
    this.selectedChat = null;
  }

  get mobileNumber() {
    return this.mobileForm.get('mobileNumber');
  }

  // --- Resolved + Rating (Phase 3 Step 4) ---

  initiateResolve() {
    this.showRatingModal = true;
    this.pendingRating = 0;
  }

  setRating(star: number): void {
    this.pendingRating = star;
  }

  submitRatingAndResolve(): void {
    if (!this.selectedChat || this.pendingRating === 0) return;

    this.pscs.rateChat(this.selectedChat.chat_id, this.pendingRating)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showRatingModal = false;
          this.pendingRating = 0;
          this.isResolved = true;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Rating submission failed:', err);
          // Still proceed with resolution even if rating fails
          this.showRatingModal = false;
          this.pendingRating = 0;
          this.isResolved = true;
          this.cdr.markForCheck();
        }
      });
  }

  cancelRating(): void {
    this.showRatingModal = false;
    this.pendingRating = 0;
  }

  closeResolved() {
    this.isResolved = false;
  }

  saveResolved() {
    const req = {
      customer_number: this.selectedChat.customer,
      update_by_number: this.agentNumber,
      status: 'resolved'
    };

    this.chatService.updateChatStatus(req);

    this.chatService.onUpdateChatStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response: ResponseData) => {
      if (response.status === 1) {
        this.isResolved = false;
        this.chatNumberListComponent.removeResolveChat(this.selectedChat.chat_id);
        this.selectedChat = null;

        if (this.config.showDcoPanels) {
          this.dcoInfo = false;
          this.dcoSuspendView = false;
          this.dcoPendingView = false;
          this.dcoActiveApprovedView = false;
        }

        this.chatNumberListComponent.fetchAllChat();
      } else {
        console.log('saveResolved' + JSON.stringify(response));
      }
      this.cdr.markForCheck();
    });
  }

  // --- Initiate Chat ---

  openChatWindow() {
    this.openChat = true;
  }

  closeChatWindow() {
    this.openChat = false;
  }

  sendWhatsappTemplate() {
    this.openChat = false;
    this.isChatInitiated = 1;

    // Partner uses dcoName fallback; others use customer_name directly
    const recipientName = this.config.dcoNameFallback
      ? (this.dcoName != null ? this.dcoName : this.selectedChat.customer_name)
      : this.selectedChat.customer_name;

    this.pscs.sendWhatsappTemplate(this.selectedChat.customer, recipientName).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response: {}) => {
      this.responseData = response;
      this.toastr.success(this.responseData.message);

      if (this.responseData.status !== 1) {
        this.isChatInitiated = 0;
      }
      this.cdr.markForCheck();
    });
  }

  showSuccess() {
    this.toastr.success('Data loaded successfully!', 'Success');
  }

  showError() {
    this.toastr.error('Failed to load data!', 'Error');
  }

  // --- Scroll Management ---

  ngAfterViewChecked(): void {
    if (!this.isUserScrollingUp) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.log('Error scrolling to bottom:', err);
    }
  }

  onScroll(): void {
    const container = this.messageContainer?.nativeElement;
    if (container) {
      const scrollPosition = container.scrollHeight - container.scrollTop - container.clientHeight;
      this.isUserScrollingUp = scrollPosition > this.scrollThreshold;
    }
  }

  // --- Config & Navigation ---

  fetchConfig() {
    const req = {
      sender: this.selectedChat.customer,
      customer_type: this.selectedChat.customer_type
    };

    this.chatService.fetchConfig(req);
    this.isWhatsappChatOpen = 0;
    this.chatService.onConfigResponse().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response: Config) => {
      console.log('fetchConfig' + JSON.stringify(response));
      if (response.status === 1) {
        // V2 backend returns { status: 1, config: { whatsapp_window_open: [...], ... } }
        // V1 backend returns { status: 1, isWhatsappChatOpen: 1, isChatInitiated: 1, ... }
        const v2Config = (response as any).config;
        if (v2Config) {
          // V2 format: derive isWhatsappChatOpen from whatsapp_window_open array
          const windowOpen = Array.isArray(v2Config.whatsapp_window_open) && v2Config.whatsapp_window_open.length > 0;
          this.isWhatsappChatOpen = windowOpen ? 1 : 0;
          this.isChatInitiated = 1; // V2: if config exists, chat is initiated
        } else {
          // V1 format
          this.isChatInitiated = response.isChatInitiated;
          if (this.selectedChat.last_msg_by == 'PartnerApp') {
            this.isWhatsappChatOpen = 1;
          } else {
            this.isWhatsappChatOpen = response.isWhatsappChatOpen;
          }
        }
      } else {
        // V2 backend may not implement fetch_config yet — default to open
        // so the reply textarea is shown when the chat has active messages
        this.isWhatsappChatOpen = 1;
        this.isChatInitiated = 1;
      }
      this.cdr.markForCheck();
    });
  }

  navigateToChat(chat: any) {
    console.log(JSON.stringify(chat));

    if (this.config.showDcoPanels) {
      this.dcoInfo = false;
      this.dcoSuspendView = false;
      this.dcoPendingView = false;
      this.dcoActiveApprovedView = false;
    }
    this.selectedChat = null;
    this.assignedExecutiveName = '';
    this.showReassignDropdown = false;

    if (this.config.useLoadingDelay) {
      // Partner: uses 500ms loading delay
      this.loadingNewData = true;

      this.navigateTimeout = setTimeout(() => {
        this.loadingNewData = false;
        this.selectedChat = chat.selectedChatData;
        this.assignedExecutiveName = this.selectedChat?.assigned_executive_name || '';
        // Reset pagination & loading state for fresh chat load
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.chats = [];
        this.fetchConfig();
        if (this.config.showDcoPanels) {
          this.dcoInfoShow(this.selectedChat, chat.selectedFilter);
        }
        this.fetchChatsByUser();

        console.log('Navigated to chat:', JSON.stringify(this.selectedChat.messages));
        const message = {
          chat_id: this.selectedChat.chat_id,
          type: this.config.joinChatMessageType === 'agentNumber' ? this.agentNumber : 'Agent'
        };
        this.chatService.joinChat(message);
        this.scrollToBottom();
        this.cdr.markForCheck();
      }, 500);
    } else {
      // Customer/Vendor/SRDP: no loading delay
      // For Partner-style chat list that emits {selectedChatData, selectedFilter}, extract selectedChatData
      // For other chat lists that emit the plain chat object, use it directly
      this.selectedChat = chat.selectedChatData ? chat.selectedChatData : chat;
      this.assignedExecutiveName = this.selectedChat?.assigned_executive_name || '';
      // Reset pagination & loading state for fresh chat load
      this.currentPage = 1;
      this.totalPages = 1;
      this.isLoading = false;
      this.chats = [];
      this.fetchConfig();
      this.fetchChatsByUser();

      console.log('Navigated to chat:', JSON.stringify(this.selectedChat.messages));
      const message = {
        chat_id: this.selectedChat.chat_id,
        type: this.config.joinChatMessageType === 'agentNumber' ? this.agentNumber : 'Agent'
      };
      this.chatService.joinChat(message);
      this.scrollToBottom();
    }
  }

  // --- Fetch Chat Messages ---

  public fetchChatsByUser() {
    if (this.isLoading || (this.totalPages && this.currentPage > this.totalPages)) {
      return;
    }

    if (this.currentPage == 1) {
      this.chats = [];
    }

    const req = {
      'chat_id': this.selectedChat.chat_id,
      'sender': this.agentNumber,
      page: this.currentPage,
      page_size: this.pageSize
    };

    this.isLoading = true;

    const requestedChatId = this.selectedChat.chat_id;
    console.log('fetchChatsByUser request:', JSON.stringify(req));
    this.chatService.fetchChatsByUser(req);

    // Subscribe only if not already subscribed (avoid duplicate subscriptions)
    if (!this._fetchChatsSub) {
      this._fetchChatsSub = this.chatService.onFetchChatsByUserResponse()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((response: FetchAllChatByUser) => {
          this.handleFetchChatsByUserResponse(response);
        });
    }
  }

  private handleFetchChatsByUserResponse(response: FetchAllChatByUser): void {
    console.log('fetchChatsByUser response:', JSON.stringify(response));

    // Ignore stale responses from a previously selected chat (shareReplay replay)
    const rawMessages = Array.isArray(response.messages) ? response.messages
                      : Array.isArray(response.chats) ? response.chats : [];
    if (rawMessages.length > 0 && this.selectedChat) {
      const responseChatId = (rawMessages[0] as any).chat_id;
      if (responseChatId && responseChatId !== this.selectedChat.chat_id) {
        console.log('Ignoring stale fetchChatsByUser response for:', responseChatId);
        return;
      }
    }

    this.isLoading = false;
    if (response.status === 1) {

      this.chatNumberListComponent.updateUnSeenCount(this.selectedChat.chat_id, 0);

      this.totalPages = response.pagination?.total_pages ?? 0;

      // V2 backend uses sender_type instead of type — normalize
      const chatMessages = rawMessages.map((m: any) => ({
        ...m,
        type: m.type || m.sender_type || 'Customer'
      }));
      chatMessages.sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

      this.chats = this.mergeGroupedMessages(this.chats, this.groupMessagesByDate(chatMessages));

      this.chats.forEach((message: any) => {
        // Use config to determine the media check field
        const mediaField = this.config.mediaCheckField;
        if (message[mediaField] && !message.mediaUrl) {
          this.fetchMediaFile(message.media.id)
            .then((mediaUrl) => {
              message.mediaUrl = mediaUrl;
              this.blobUrls.push(mediaUrl);
              this.cdr.markForCheck();
              console.log(message.media.id + '::' + mediaUrl);
            })
            .catch((error) => {
              console.error(`Failed to fetch media URL for message: ${message.id}`, error);
            });
        }
      });

    } else {
      this.errorMessage = response.message || 'An error occurred';
    }
    this.cdr.markForCheck();
  }

  loadMoreMessages() {
    this.currentPage++;
    this.fetchChatsByUser();
  }

  // --- Send Message ---

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        event.stopPropagation();
      } else {
        event.preventDefault();
        this.sendMessage();
      }
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedChat) {

      const message: any = {
        chat_id: this.selectedChat.chat_id,
        sender: this.agentNumber,
        type: 'Agent',
        message: this.newMessage,
        chat_type: 'message',
        datetime: this.getFormattedCurrentDateByZone()
      };

      // Customer variant includes customer_type in sendMessage payload
      if (this.config.includeCustomerTypeInSendMessage) {
        message.customer_type = this.selectedChat.customer_type;
      }

      this.chats.push(message);
      this.newMessage = '';

      this.chatService.sendMessage(message);

      this.scrollToBottom();
    }
  }

  // --- New Message Listener ---

  onNewMessage() {
    this.chatService.onNewMessage().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message: Message) => {
      console.log('New message received:', message);
      // V2 backend uses sender_type instead of type — normalize
      if (!message.type && (message as any).sender_type) {
        message.type = (message as any).sender_type;
      }

      if (message.type != 'Agent' && this.selectedChat && message.sender == this.selectedChat.customer) {
        message['chat_type'] = 'message';
        this.chats.push(message);
      }

      this.scrollToBottom();
      this.cdr.markForCheck();
    });
  }

  // --- Message Grouping ---

  groupMessagesByDate(messages: any[]): any[] {
    const groupedMessages: any[] = [];
    let currentDate: string = '';

    messages.forEach((message) => {
      const messageDate = format(parseISO(message.datetime), 'yyyy-MM-dd');

      if (messageDate !== currentDate) {
        currentDate = messageDate;

        groupedMessages.push({
          chat_type: 'date-separator',
          date: currentDate
        });
      }

      groupedMessages.push({ ...message, chat_type: 'message' });
    });

    return groupedMessages;
  }

  mergeGroupedMessages(existingChats: any[], newChats: any[]): any[] {
    const mergedChats = [...existingChats];

    newChats.forEach((newMessage) => {
      if (newMessage.chat_type === 'date-separator') {
        if (!mergedChats.some((chat) => chat.chat_type === 'date-separator' && chat.date === newMessage.date)) {
          mergedChats.push(newMessage);
        }
      } else {
        if (!mergedChats.some((chat) => chat.datetime === newMessage.datetime)) {
          mergedChats.push(newMessage);
        }
      }
    });

    return mergedChats.sort((a: any, b: any) => {
      if (a.chat_type === 'date-separator' && b.chat_type !== 'date-separator') {
        // Date separator should come BEFORE messages of the same date (use <=)
        return a.date <= b.datetime.split('T')[0] ? -1 : 1;
      }
      if (b.chat_type === 'date-separator' && a.chat_type !== 'date-separator') {
        // Date separator should come BEFORE messages of the same date (use <=)
        return b.date <= a.datetime.split('T')[0] ? 1 : -1;
      }
      if (a.chat_type === 'date-separator' && b.chat_type === 'date-separator') {
        return a.date.localeCompare(b.date);
      }

      return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
    });
  }

  // --- Date/Time Formatting ---

  formatDate(date: string): string {
    try {
      if (!date) return 'Invalid Date';

      const messageDate = parseISO(date);

      if (isToday(messageDate)) return 'Today';

      if (isYesterday(messageDate)) return 'Yesterday';

      return format(messageDate, 'dd/MM/yyyy');
    } catch (error) {
      console.warn('Error parsing date input:', date, 'Error:', error);
      return 'Invalid Date';
    }
  }

  formatTime(timestamp: string): string {
    return format(parseISO(timestamp), 'hh:mm a');
  }

  // --- DCO Panel Management (Partner only) ---

  dcoInfoShow(chatNumber: any, selectedFilter: any) {
    console.log(chatNumber.customer);
    this.chatNumber = chatNumber.customer;

    if (selectedFilter == 'Suspend') {
      this.dcoSuspendView = true;
    } else if (selectedFilter == 'Pending') {
      this.dcoPendingView = true;
    } else if (selectedFilter == 'Active_Approved') {
      this.dcoActiveApprovedView = true;
    } else {
      this.dcoInfo = true;
    }
  }

  getDcoName(data: any) {
    this.dcoName = data;
  }

  handleDropdownSelected(data: { status: boolean; value: string }): void {
    console.log('Status:', data.status, 'Selected Value:', data.value);
    this.selectedView = data.value;
    this.dcoInfo = false;
    this.dcoSuspendView = false;
    this.dcoPendingView = false;
    this.dcoActiveApprovedView = false;
    this.selectedChat = null;
  }

  // --- Media ---

  fetchMediaFile(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject('Media ID is missing');
        return;
      }

      this.pscs.fetchMediaFile(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (mediaUrl) => {
          resolve(mediaUrl);
        },
        error: (err) => {
          console.error('Error fetching media file:', err);
          reject(err);
        },
      });
    });
  }

  // --- Utilities ---

  getFormattedCurrentDateByZone() {
    const timeZone = 'Asia/Kolkata';
    const now = new Date();
    return formatInTimeZone(now, timeZone, 'yyyy-MM-dd HH:mm:ss');
  }

  // --- ChatGPT Integration (Partner only) ---

  clearChatGptInterval(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }

  startChatGptInterval(): void {
    this.intervalId = setTimeout(() => this.ask_chatgpt(), 10000);
  }

  ask_chatgpt() {
    const requestData = {
      'message': this.custmore_msg.join(', ')
    };

    this.pscs.getChatGPTResponse(requestData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: {}) => {
      this.responseData = data;

      if (this.responseData.reply) {
        this.chatgptReply = true;
        this.stopTypingDots();
        this.simulateTyping(this.responseData.reply);
        this.custmore_msg = [];
        this.clearChatGptInterval();
      }
      this.cdr.markForCheck();
    }, error => {
      console.log('getChatGPTResponse error :', error);
    });
  }

  resizeTextArea() {
    setTimeout(() => {
      if (this.chatInputRef?.nativeElement) {
        const textarea = this.chatInputRef.nativeElement as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });
  }

  resizeTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  simulateTyping(text: string) {
    this.chatgptMessage = '';
    let i = 0;

    this.typingInterval = setInterval(() => {
      if (i < text.length) {
        this.chatgptMessage += text[i];
        this.resizeTextArea();
        i++;
      } else {
        this.stopSimulateTyping();
      }
      this.cdr.markForCheck();
    }, 25);
  }

  stopSimulateTyping() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = null;
    }
  }

  startTypingDots() {
    this.stopTypingDots();
    this.isLoader = true;
    this.chatgptMessage = '';
    this.dotLoader = '';
    this.loaderInterval = setInterval(() => {
      if (this.dotLoader.length >= 3) {
        this.dotLoader = '';
      } else {
        this.dotLoader += '.';
      }
      this.chatgptMessage = this.dotLoader;
      this.cdr.markForCheck();
    }, 400);
  }

  stopTypingDots() {
    clearInterval(this.loaderInterval);
    this.isLoader = false;
    this.chatgptMessage = '';
  }

  // --- Right Panel Tab Switching (Phase 4 Step 1) ---

  switchRightPanel(tab: RightPanelTab): void {
    this.activeRightPanel = tab;
    this.cdr.markForCheck();
  }

  // --- Context History (Phase 4 Step 2) ---

  onContextItemClicked(item: any): void {
    console.log('Context item clicked:', item.id);
  }

  // --- Chat Assignment (Phase 3 Step 1) ---

  toggleReassignDropdown(): void {
    this.showReassignDropdown = !this.showReassignDropdown;
  }

  reassignToExecutive(exec: ExecutiveStatusUpdate): void {
    if (!this.selectedChat) return;
    this.chatService.reassignChat({
      chat_id: this.selectedChat.chat_id,
      executive_id: exec.executive_id
    });
    this.showReassignDropdown = false;
  }

  // --- Chat Tagging (Phase 3 Step 3) ---

  get availableTags(): string[] {
    const stakeholder = this.config.chatListCustomerType || 'Partner';
    const allTags = PREDEFINED_TAGS[stakeholder] || PREDEFINED_TAGS['Partner'] || [];
    const currentTags = this.selectedChat?.tags || [];
    return allTags.filter((t: string) => !currentTags.includes(t));
  }

  toggleTagSelector(): void {
    this.showTagSelector = !this.showTagSelector;
  }

  addTag(tag: string): void {
    if (!this.selectedChat) return;
    this.chatService.applyTag({
      chat_id: this.selectedChat.chat_id,
      tag
    });
    // Optimistic update
    if (!this.selectedChat.tags) {
      this.selectedChat.tags = [];
    }
    this.selectedChat.tags = [...this.selectedChat.tags, tag];
    this.showTagSelector = false;
    this.cdr.markForCheck();
  }

  removeTag(tag: string): void {
    if (!this.selectedChat) return;
    this.chatService.removeTag({
      chat_id: this.selectedChat.chat_id,
      tag
    });
    // Optimistic update
    this.selectedChat.tags = (this.selectedChat.tags || []).filter((t: string) => t !== tag);
    this.cdr.markForCheck();
  }

  /**
   * Helper to determine user-message ngClass.
   * Partner/Customer/Vendor: message.type === 'Customer'
   * SRDP: message.type !== 'Agent'
   */
  isUserMessage(message: any): boolean {
    if (this.config.userMessageNgClass === 'not_agent') {
      return message.type !== 'Agent';
    }
    return message.type === 'Customer';
  }

  /**
   * Returns the chat title based on config.
   * Partner/Vendor/SRDP: selectedChat.customer_name
   * Customer: selectedChat.customer
   */
  getChatTitle(): string {
    if (!this.selectedChat) return '';
    return this.config.chatTitleField === 'customer'
      ? this.selectedChat.customer
      : this.selectedChat.customer_name;
  }

  // Phase 4 Step 4: Quick Actions handler
  handleQuickAction(action: QuickAction): void {
    switch (action) {
      case 'send_template':
        this.toggleTemplatePicker();
        break;
      case 'reassign':
        this.toggleReassignDropdown();
        this.switchRightPanel('profile');
        break;
      case 'resolve':
        this.initiateResolve();
        break;
      case 'send_resolved_template':
        // Will wire to resolved template flow
        break;
      case 'manage_tags':
        this.toggleTagSelector();
        break;
      case 'pickup_drop_city':
        // Will wire to city sender flow
        break;
    }
  }

  // Phase 4 Step 6: Template Picker
  toggleTemplatePicker(): void {
    this.showTemplatePicker = !this.showTemplatePicker;
    this.cdr.markForCheck();
  }

  closeTemplatePicker(): void {
    this.showTemplatePicker = false;
    this.cdr.markForCheck();
  }

  onTemplateSelected(template: WhatsAppTemplate): void {
    this.showTemplatePicker = false;
    // Send the template as a message via chat service
    if (this.selectedChat) {
      this.chatService.sendMessage({
        chat_id: this.selectedChat.chat_id,
        message: template.content,
        template_id: template.id,
        template_name: template.name
      });
    }
    this.cdr.markForCheck();
  }
}

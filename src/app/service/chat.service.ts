import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, shareReplay, EMPTY } from 'rxjs';
import { Chat, ChatAssignment, Chats, Config, DashboardStats, ExecutiveStatusUpdate, FetchAllChat, FetchAllChatByUser, InternalNote, Message, ReassignRequest, ResponseData, TagUpdate } from '../models/chat.model';
import { APiProperties } from '../class/api-properties';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  apiProperties: APiProperties = new APiProperties();

  private apiUrl = 'http://localhost:5000';

  // Socket is nullable — created only after connect() is called with JWT
  private socket: Socket | null = null;

  // Track connection state
  private _isConnected = false;
  get isConnected(): boolean { return this._isConnected; }

  // Cached shared Observables — each socket event gets exactly ONE listener
  private newMessage$?: Observable<Message>;
  private roomUpdate$?: Observable<Chats>;
  private fetchAllChatsResponse$?: Observable<FetchAllChat>;
  private searchChatResponse$?: Observable<FetchAllChat>;
  private fetchChatsByUserResponse$?: Observable<FetchAllChatByUser>;
  private configResponse$?: Observable<Config>;
  private updateChatStatusResponse$?: Observable<ResponseData>;
  private typing$?: Observable<{ chat_id: string; sender: string }>;
  private driverChatStats$?: Observable<any>;
  private dashboardStats$?: Observable<DashboardStats>;
  private executiveStatus$?: Observable<ExecutiveStatusUpdate>;
  private chatAssigned$?: Observable<ChatAssignment>;
  private chatReassigned$?: Observable<ChatAssignment>;
  private slaAlert$?: Observable<any>;
  private tagUpdated$?: Observable<TagUpdate>;
  private noteAdded$?: Observable<InternalNote>;

  constructor(private http: HttpClient) {
    // Do NOT initialize socket or observables here.
    // connect() must be called after login provides the JWT.
  }

  // --- Socket lifecycle ---

  /**
   * Create the WebSocket connection with JWT authentication.
   * Must be called once after successful login.
   */
  connect(token: string): void {
    if (this.socket) {
      console.warn('ChatService: socket already connected. Disconnecting first.');
      this.disconnect();
    }

    this.socket = io(this.apiProperties.pySmartChatUrlForChat, {
      path: '/ws',
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this._isConnected = true;

    // Reset all cached observables so they bind to the new socket
    this.resetObservables();

    // Initialize shared observables and socket listeners
    this.initializeSharedObservables();
    this.initializeSocketListeners();
  }

  /**
   * Disconnect the socket. Call on logout.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
    this.resetObservables();
  }

  private resetObservables(): void {
    this.newMessage$ = undefined;
    this.roomUpdate$ = undefined;
    this.fetchAllChatsResponse$ = undefined;
    this.searchChatResponse$ = undefined;
    this.fetchChatsByUserResponse$ = undefined;
    this.configResponse$ = undefined;
    this.updateChatStatusResponse$ = undefined;
    this.typing$ = undefined;
    this.driverChatStats$ = undefined;
    this.dashboardStats$ = undefined;
    this.executiveStatus$ = undefined;
    this.chatAssigned$ = undefined;
    this.chatReassigned$ = undefined;
    this.slaAlert$ = undefined;
    this.tagUpdated$ = undefined;
    this.noteAdded$ = undefined;
  }

  /** Eagerly create all shared Observables so socket listeners are registered once. */
  private initializeSharedObservables(): void {
    this.onNewMessage();
    this.onRoomUpdate();
    this.onFetchAllChatsResponse();
    this.search_chat_response();
    this.onFetchChatsByUserResponse();
    this.onConfigResponse();
    this.onUpdateChatStatus();
    this.onTyping();
    this.onDriverChatStats();
    this.onDashboardStats();
    this.onExecutiveStatus();
    this.onChatAssigned();
    this.onChatReassigned();
    this.onSlaAlert();
    this.onTagUpdated();
    this.onNoteAdded();
  }

  // --- Emit methods (guard against null socket) ---

  fetchConfig(data: {}): void {
    this.socket?.emit('config', data);
  }

  fetchAllChatUser(data: {}): void {
    this.socket?.emit('fetch_all_chats', data);
  }

  search_chat(data: {}): void {
    this.socket?.emit('search_chat', data);
  }

  fetchChatsByUser(data: {}): void {
    this.socket?.emit('fetch_chats_by_user', data);
  }

  sendMessage(data: {}): void {
    this.socket?.emit('send_message', data);
  }

  joinChat(data: {}): void {
    this.socket?.emit('join_chat', data);
  }

  /**
   * Join a customer-type room to receive room_update broadcasts.
   * V2 backend broadcasts room_update_customer to CustomerApp room, etc.
   * Call this when a chat list page loads so we receive real-time list updates.
   */
  joinRoom(room: string): void {
    this.socket?.emit('join_room', { room });
  }

  updateChatStatus(data: {}): void {
    this.socket?.emit('update_chat_status', data);
  }

  emitTyping(chatId: string, sender: string): void {
    this.socket?.emit('typing', { chat_id: chatId, sender });
  }

  setExecutiveStatus(data: { status: string }): void {
    this.socket?.emit('set_executive_status', data);
  }

  reassignChat(data: ReassignRequest): void {
    this.socket?.emit('reassign_chat', data);
  }

  applyTag(data: { chat_id: string; tag: string }): void {
    this.socket?.emit('apply_tag', data);
  }

  removeTag(data: { chat_id: string; tag: string }): void {
    this.socket?.emit('remove_tag', data);
  }

  addNote(data: { chat_id: string; content: string }): void {
    this.socket?.emit('add_note', data);
  }

  // --- Listen methods (shared Observables — one listener per event) ---

  onNewMessage(): Observable<Message> {
    if (!this.newMessage$) {
      if (!this.socket) return EMPTY as Observable<Message>;
      this.newMessage$ = new Observable<Message>((observer) => {
        this.socket!.on('new_message', (data: Message) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.newMessage$;
  }

  /**
   * Listen to ALL room_update variants.
   * V2 backend broadcasts to customer-type-specific events:
   *   room_update          → PartnerApp room
   *   room_update_customer → CustomerApp room
   *   room_update_vendor   → VendorApp room
   *   room_update_srdp     → SRDPApp room
   * We merge them all into a single observable so chat-number-list works for every type.
   */
  onRoomUpdate(): Observable<Chats> {
    if (!this.roomUpdate$) {
      if (!this.socket) return EMPTY as Observable<Chats>;
      this.roomUpdate$ = new Observable<Chats>((observer) => {
        const handler = (data: Chats) => observer.next(data);
        this.socket!.on('room_update', handler);
        this.socket!.on('room_update_customer', handler);
        this.socket!.on('room_update_vendor', handler);
        this.socket!.on('room_update_srdp', handler);
      }).pipe(shareReplay(1));
    }
    return this.roomUpdate$;
  }

  onFetchAllChatsResponse(): Observable<FetchAllChat> {
    if (!this.fetchAllChatsResponse$) {
      if (!this.socket) return EMPTY as Observable<FetchAllChat>;
      this.fetchAllChatsResponse$ = new Observable<FetchAllChat>((observer) => {
        this.socket!.on('fetch_all_chats_response', (data: FetchAllChat) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.fetchAllChatsResponse$;
  }

  search_chat_response(): Observable<FetchAllChat> {
    if (!this.searchChatResponse$) {
      if (!this.socket) return EMPTY as Observable<FetchAllChat>;
      this.searchChatResponse$ = new Observable<FetchAllChat>((observer) => {
        this.socket!.on('search_chat_response', (data: FetchAllChat) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.searchChatResponse$;
  }

  onFetchChatsByUserResponse(): Observable<FetchAllChatByUser> {
    if (!this.fetchChatsByUserResponse$) {
      if (!this.socket) return EMPTY as Observable<FetchAllChatByUser>;
      this.fetchChatsByUserResponse$ = new Observable<FetchAllChatByUser>((observer) => {
        this.socket!.on('fetch_chats_by_user_response', (data: FetchAllChatByUser) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.fetchChatsByUserResponse$;
  }

  onConfigResponse(): Observable<Config> {
    if (!this.configResponse$) {
      if (!this.socket) return EMPTY as Observable<Config>;
      this.configResponse$ = new Observable<Config>((observer) => {
        this.socket!.on('config_response', (data: Config) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.configResponse$;
  }

  onUpdateChatStatus(): Observable<ResponseData> {
    if (!this.updateChatStatusResponse$) {
      if (!this.socket) return EMPTY as Observable<ResponseData>;
      this.updateChatStatusResponse$ = new Observable<ResponseData>((observer) => {
        this.socket!.on('update_chat_status_response', (data: ResponseData) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.updateChatStatusResponse$;
  }

  onTyping(): Observable<{ chat_id: string; sender: string }> {
    if (!this.typing$) {
      if (!this.socket) return EMPTY as Observable<{ chat_id: string; sender: string }>;
      this.typing$ = new Observable<{ chat_id: string; sender: string }>((observer) => {
        this.socket!.on('user_typing', (data) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.typing$;
  }

  onDriverChatStats(): Observable<any> {
    if (!this.driverChatStats$) {
      if (!this.socket) return EMPTY;
      this.driverChatStats$ = new Observable<any>((observer) => {
        this.socket!.on('driver-chat-stats', (data: any) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.driverChatStats$;
  }

  onDashboardStats(): Observable<DashboardStats> {
    if (!this.dashboardStats$) {
      if (!this.socket) return EMPTY as Observable<DashboardStats>;
      this.dashboardStats$ = new Observable<DashboardStats>((observer) => {
        this.socket!.on('dashboard_stats', (data: any) => {
          // V2 sends { active, resolved, awaiting_customer_response }
          // Frontend expects { active, resolved, pending }
          observer.next({
            active: data.active ?? 0,
            resolved: data.resolved ?? 0,
            pending: data.pending ?? data.awaiting_customer_response ?? 0,
          });
        });
      }).pipe(shareReplay(1));
    }
    return this.dashboardStats$;
  }

  onExecutiveStatus(): Observable<ExecutiveStatusUpdate> {
    if (!this.executiveStatus$) {
      if (!this.socket) return EMPTY as Observable<ExecutiveStatusUpdate>;
      this.executiveStatus$ = new Observable<ExecutiveStatusUpdate>((observer) => {
        this.socket!.on('executive_status', (data: ExecutiveStatusUpdate) => {
          // V2 sends lowercase "online"/"offline"; normalize to uppercase for frontend
          if (data.status) {
            data.status = data.status.toUpperCase();
          }
          observer.next(data);
        });
      }).pipe(shareReplay(1));
    }
    return this.executiveStatus$;
  }

  onChatAssigned(): Observable<ChatAssignment> {
    if (!this.chatAssigned$) {
      if (!this.socket) return EMPTY as Observable<ChatAssignment>;
      this.chatAssigned$ = new Observable<ChatAssignment>((observer) => {
        this.socket!.on('chat_assigned', (data: ChatAssignment) => {
          // V2 sends { chat_id, assigned_executive_id }; normalize to executive_id
          if (!data.executive_id && data.assigned_executive_id) {
            data.executive_id = data.assigned_executive_id;
          }
          observer.next(data);
        });
      }).pipe(shareReplay(1));
    }
    return this.chatAssigned$;
  }

  onChatReassigned(): Observable<ChatAssignment> {
    if (!this.chatReassigned$) {
      if (!this.socket) return EMPTY as Observable<ChatAssignment>;
      this.chatReassigned$ = new Observable<ChatAssignment>((observer) => {
        this.socket!.on('chat_reassigned', (data: ChatAssignment) => {
          // V2 sends { chat_id, from_executive_id, to_executive_id }; normalize to executive_id
          if (!data.executive_id && data.to_executive_id) {
            data.executive_id = data.to_executive_id;
          }
          observer.next(data);
        });
      }).pipe(shareReplay(1));
    }
    return this.chatReassigned$;
  }

  onSlaAlert(): Observable<any> {
    if (!this.slaAlert$) {
      if (!this.socket) return EMPTY;
      this.slaAlert$ = new Observable<any>((observer) => {
        this.socket!.on('sla_alert', (data: any) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.slaAlert$;
  }

  onTagUpdated(): Observable<TagUpdate> {
    if (!this.tagUpdated$) {
      if (!this.socket) return EMPTY as Observable<TagUpdate>;
      this.tagUpdated$ = new Observable<TagUpdate>((observer) => {
        this.socket!.on('tag_updated', (data: TagUpdate) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.tagUpdated$;
  }

  onNoteAdded(): Observable<InternalNote> {
    if (!this.noteAdded$) {
      if (!this.socket) return EMPTY as Observable<InternalNote>;
      this.noteAdded$ = new Observable<InternalNote>((observer) => {
        this.socket!.on('note_added', (data: InternalNote) => observer.next(data));
      }).pipe(shareReplay(1));
    }
    return this.noteAdded$;
  }

  // --- Socket lifecycle listeners ---

  private initializeSocketListeners(): void {
    this.socket?.on('connect', () => {
      console.log('Socket connected!');
    });

    this.socket?.on('disconnect', () => {
      console.warn('Socket disconnected!');
    });

    this.socket?.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

}

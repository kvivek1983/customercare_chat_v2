export interface Chat {
  id: string;
  customer: string;
  status: string;
  messages: Message[];
}
  
export interface Message {
  sender: string;
  type: string;
  sender_type?: string;  // V2 backend uses sender_type instead of type
  message: string;
  datetime: string;
  media_type : string;
  media?: Media;
  chat_type?: string;
  mediaUrl?: string;
  chat_id?: string;      // V2 includes chat_id in new_message broadcasts
  channel?: string;      // V2: "whatsapp" | "inapp"
  message_id?: string;   // V2: unique message identifier
  message_tag?: string;  // V2: WhatsApp interactive button reply ID
  seen_by?: string[];    // V2: executives who have viewed this message
}

export interface Media {
  filename?: string; // Filename for documents or images
  mime_type?: string; // MIME type, e.g., 'application/pdf' or 'image/jpeg'
  sha256?: string; // Hash for integrity checks
  id?: string; // Identifier for the media
  [key: string]: any; // Allow additional properties if needed
}

export interface FetchAllChat{
  status : number;
  message : string;
  chats : Chats[];
  pagination : Pagination;
}

export interface FetchAllChatByUser{
  status : number;
  message : string;
  chats : Message[];
  messages?: Message[];   // V2 backend returns "messages" instead of "chats"
  pagination : Pagination;
}

export interface Chats{
  chat_id : string;
  customer : string;
  customer_name : string;
  customer_type : string;
  last_msg_by : string;
  last_message : string;
  last_message_time : string;
  unseen_count : number;
  assigned_executive_id?: string;
  assigned_executive_name?: string;
  tags?: string[];
  rating?: number;
  last_incoming_message_time?: string;  // Normalized from V2 last_incoming_message
  last_interaction_by?: string;
  // V2 fields (raw from backend, normalized in normalizeChat)
  last_incoming_message?: string;       // V2 field name for SLA timer source
  last_incoming_whatsapp_message?: string; // V2: for 24h service window
  last_outgoing_message?: string;       // V2: last executive message time
  is_resolved?: boolean;                // V2: convenience boolean
  status?: string;                      // V2: "active" | "resolved"
}

export interface Config{
  status : number;
  message : string;
  chat_id : string;
  isFreshChat : number;
  isWhatsappChatOpen : number;
  isChatInitiated : number;
}

export interface Pagination{
  page : number;
  page_size : number;
  total_chats : number;
  total_pages : number;
  total?: number;  // V2 sends "total" instead of "total_chats"
}

export interface ResponseData{
  status : number;
  message : string;
}

export interface LoginResponse {
  // V2 fields
  accessToken: string;
  refreshToken?: string;
  agentNumber: string;
  adminid: string;
  name?: string;           // V2 may not return this — derived from username
  // V1 compat fields
  token?: string;
  executive_id?: string;
  agent_number?: string;
}

export interface DashboardStats {
  active: number;
  resolved: number;
  pending: number;
}

export type ExecutiveStatus = 'ONLINE' | 'OFFLINE';

export interface ExecutiveStatusUpdate {
  executive_id: string;
  name?: string;
  status: string;           // V2 sends lowercase "online"/"offline"
  customer_type?: string;   // V2 includes customer_type
}

export interface ChatAssignment {
  chat_id: string;
  executive_id?: string;         // V1 field
  executive_name?: string;       // V1 field
  assigned_executive_id?: string; // V2 chat_assigned field
  from_executive_id?: string;    // V2 chat_reassigned field
  to_executive_id?: string;      // V2 chat_reassigned field
}

export interface ReassignRequest {
  chat_id: string;
  executive_id: string;
}

export interface TagUpdate {
  chat_id: string;
  tags?: string[];    // V1: full array
  tag?: string;       // V2: single tag
  action?: string;    // V2: "add" | "remove"
}

export const PREDEFINED_TAGS: Record<string, string[]> = {
  Partner: ['Payment Issue', 'Document Pending', 'Route Query', 'App Bug', 'Vehicle Issue'],
  Customer: ['Booking Help', 'Refund Request', 'Driver Complaint', 'Fare Dispute', 'Cancellation'],
  Vendor: ['Fleet Update', 'Payment Delay', 'Agreement', 'Vehicle Registration'],
  SRDP: ['Route Assignment', 'Delivery Issue', 'Payment Query'],
};

// Phase 4: Right Panel
export type RightPanelTab = 'profile' | 'rides' | 'context' | 'actions' | 'notes';

// Phase 4 Step 2: Context History
export interface ContextHistoryItem {
  id: string;
  context: Record<string, string>;
  createdAt: string;
  chatCount: number;
  status: 'active' | 'resolved';
}

export interface ContextHistoryResponse {
  status: number;
  message: string;
  items: ContextHistoryItem[];
}

// Phase 4 Step 3: Rides Panel
export interface RideInfo {
  id: string;
  type: string;
  route: string;
  date: string;
  status: 'upcoming' | 'completed';
}

export interface SearchHistoryItem {
  from: string;
  to: string;
  date: string;
}

export interface RidesResponse {
  status: number;
  message: string;
  rides: RideInfo[];
  searchHistory: SearchHistoryItem[];
}

// Phase 4 Step 5: Internal Notes
export interface InternalNote {
  id: string;
  chat_id: string;
  content: string;
  author_name: string;
  author_id: string;
  created_at: string;
}

export interface NotesResponse {
  status: number;
  message: string;
  notes: InternalNote[];
}

// Phase 4 Step 6: Template Picker
export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  content: string;
  category: string;
}

export interface TemplatesResponse {
  status: number;
  message: string;
  templates: WhatsAppTemplate[];
}
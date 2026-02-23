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
  last_incoming_message_time?: string;
  last_interaction_by?: string;
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
}

export interface ResponseData{
  status : number;
  message : string;
}

export interface LoginResponse {
  token: string;
  executive_id: string;
  name: string;
  agent_number: string;
}

export interface DashboardStats {
  active: number;
  resolved: number;
  pending: number;
}

export type ExecutiveStatus = 'ONLINE' | 'OFFLINE';

export interface ExecutiveStatusUpdate {
  executive_id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
}

export interface ChatAssignment {
  chat_id: string;
  executive_id: string;
  executive_name: string;
}

export interface ReassignRequest {
  chat_id: string;
  executive_id: string;
}

export interface TagUpdate {
  chat_id: string;
  tags: string[];
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
# Customer Care Chat V2 — Complete API Mapping

**Last Updated:** 20 Feb 2026

---

## Domain / Base URLs

| Property | Localhost (Staging) | Production |
|----------|---------------------|------------|
| `pySmartChatUrl` | `https://restchatsupport2.oneway.cab/` | `https://restchatsupport2.oneway.cab/` |
| `pySmartChatUrlForChat` | `https://restchatsupport2.oneway.cab` | `https://restchatsupport2.oneway.cab` |
| `pySmartChatV2AuthUrl` | `https://restchatsupport2.oneway.cab/api/auth/login` | `https://restchatsupport2.oneway.cab/api/auth/login` |
| `pySmartChatV2RateUrl` | `https://restchatsupport2.oneway.cab/api/chats` | `https://restchatsupport2.oneway.cab/api/chats` |
| `nodejsOnewayAdminUrl` | `https://stagingnode.oneway.cab/` | `https://node.oneway.cab/` |
| `webApiURL` | `https://stagingwebapi.oneway.cab/third/` | `https://webapi.oneway.cab/third/` |
| `partnerEnrollApi` | `https://stagingpartnerenrolapi.oneway.cab/rest/V1/` | `https://partnerenrolapi.oneway.cab/rest/V1/` |
| `onewayLocationWebSocketApi` | `wss://staginglocationsocket.oneway.cab/` | `wss://locationsocket.oneway.cab/` |

---

## REST API Endpoints (25 total)

### PySmartChat — `restchatsupport2.oneway.cab` (10 endpoints)

**Service file:** `src/app/service/py-smart-chat.service.ts`

| # | Method | HTTP | Endpoint | Purpose |
|---|--------|------|----------|---------|
| 1 | `loginV2()` | POST | `/api/auth/login` | Executive authentication |
| 2 | `getChatGPTResponse()` | POST | `/api/chats/chat_gpt` | Get ChatGPT suggested reply |
| 3 | `rateChat()` | POST | `/api/chats/{chatId}/rate` | Submit post-resolution rating (1-5 stars) |
| 4 | `sendWhatsappTemplate()` | GET | `/api/chats/send_whatsapp_template?to={number}&name={name}` | Send WhatsApp template message |
| 5 | `fetchMediaFile()` | GET | `/api/whatsapp/downloadmedia/{mediaId}` | Download WhatsApp media file |
| 6 | `fetchContextHistory()` | GET | `/api/chats/{customerNumber}/context-history` | Context change timeline per customer |
| 7 | `fetchRides()` | GET | `/api/chats/{customerNumber}/rides` | Upcoming rides + search history |
| 8 | `fetchNotes()` | GET | `/api/chats/{chatId}/notes` | Internal executive notes per chat |
| 9 | `fetchTemplates()` | GET | `/api/templates?stakeholder={stakeholderType}` | WhatsApp template list by stakeholder |
| 10 | `partner_stats()` | GET | `/api/dashboard/stats` | Dashboard statistics |

---

### Node Admin — `node.oneway.cab` (6 endpoints)

**Service file:** `src/app/service/oneway-node.service.ts`

| # | Method | HTTP | Endpoint | Purpose |
|---|--------|------|----------|---------|
| 1 | `login()` | POST | `/login` | User login |
| 2 | `logout()` | POST | `/logout` | User logout |
| 3 | `getBookingDetailsByDisplayBookingId()` | POST | `/getBookingDetailsByDisplayBookingId` | Lookup booking by display ID |
| 4 | `getDriverDetailsOfBooking()` | POST | `/getDriverDetailsOfBooking` | Driver info for a booking |
| 5 | `getDcoDetails()` | POST | `/getDcoDetails` | DCO (Driver Care Officer) details |
| 6 | `dcoTransactionHistory()` | POST | `/dcoTransactionHistory` | DCO transaction history |

---

### Web API — `webapi.oneway.cab/third` (2 endpoints)

**Service file:** `src/app/service/oneway-web-api.service.ts`

| # | Method | HTTP | Endpoint | Purpose |
|---|--------|------|----------|---------|
| 1 | `getAccessKeyWeb()` | POST | `/getAccessKey` | Get web access key |
| 2 | `getDriverAndCabImages()` | POST | `/getDriverAndCabImages` | Fetch driver and cab photos |

---

### Partner Enrol API — `partnerenrolapi.oneway.cab/rest/V1` (7 endpoints)

**Service file:** `src/app/service/oneway-partner-enrol-api.service.ts`

| # | Method | HTTP | Endpoint | Purpose |
|---|--------|------|----------|---------|
| 1 | `getAlternateNumbers()` | POST | `/getAlternateNumbers` | Alternate contact numbers |
| 2 | `getPartner()` | POST | `/getPartner` | Partner details |
| 3 | `resendPaytmPaymentLink()` | POST | `/resendPaytmPaymentLink` | Resend Paytm payment link |
| 4 | `fetchAllTagsForFreelancer()` | POST | `/fetchAllTagsForFreelancer` | All tags for freelancer |
| 5 | `fetchMainTags()` | POST | `/fetchMainTags` | Main tag categories |
| 6 | `fetchSubTagsForMainTags()` | POST | `/fetchSubTagsForMainTags` | Sub-tags under main categories |
| 7 | `updateDCOStatusByFreelancer()` | POST | `/updateDCOStatusByFreelancer` | Update DCO status |

---

## WebSocket Events (29 total)

**Service file:** `src/app/service/chat.service.ts`

**Connection:**
- URL: `restchatsupport2.oneway.cab` with path `/ws`
- Transport: WebSocket + Polling fallback
- Auth: JWT token via query parameter

---

### Emit — Client → Server (13 events)

| # | Event Name | Method | Data | Purpose |
|---|------------|--------|------|---------|
| 1 | `config` | `fetchConfig()` | `{}` | Request chat configuration |
| 2 | `fetch_all_chats` | `fetchAllChatUser()` | `{assigned_executive_id?}` | Fetch chat list (My/All filter) |
| 3 | `search_chat` | `search_chat()` | `{}` | Search chats by keyword |
| 4 | `fetch_chats_by_user` | `fetchChatsByUser()` | `{}` | Fetch chats for specific user |
| 5 | `send_message` | `sendMessage()` | `{chat_id, message, template_id?}` | Send chat message |
| 6 | `join_chat` | `joinChat()` | `{}` | Join a chat room |
| 7 | `update_chat_status` | `updateChatStatus()` | `{customer_number, status}` | Resolve / update chat status |
| 8 | `typing` | `emitTyping()` | `{chat_id, sender}` | Broadcast typing indicator |
| 9 | `set_executive_status` | `setExecutiveStatus()` | `{status}` | Online / Offline toggle |
| 10 | `reassign_chat` | `reassignChat()` | `ReassignRequest` | Reassign chat to another executive |
| 11 | `apply_tag` | `applyTag()` | `{chat_id, tag}` | Add tag to chat |
| 12 | `remove_tag` | `removeTag()` | `{chat_id, tag}` | Remove tag from chat |
| 13 | `add_note` | `addNote()` | `{chat_id, content}` | Add internal note to chat |

---

### Listen — Server → Client (16 events)

| # | Event Name | Method | Response Type | Purpose |
|---|------------|--------|---------------|---------|
| 1 | `new_message` | `onNewMessage()` | `Message` | Incoming chat message |
| 2 | `room_update` | `onRoomUpdate()` | `Chats` | Chat room data update |
| 3 | `fetch_all_chats_response` | `onFetchAllChatsResponse()` | `FetchAllChat` | Chat list response |
| 4 | `search_chat_response` | `search_chat_response()` | `FetchAllChat` | Search results |
| 5 | `fetch_chats_by_user_response` | `onFetchChatsByUserResponse()` | `FetchAllChatByUser` | User's chats response |
| 6 | `config_response` | `onConfigResponse()` | `Config` | Chat configuration data |
| 7 | `update_chat_status_response` | `onUpdateChatStatus()` | `ResponseData` | Status update acknowledgement |
| 8 | `user_typing` | `onTyping()` | `{chat_id, sender}` | Typing indicator broadcast |
| 9 | `driver-chat-stats` | `onDriverChatStats()` | `any` | Driver chat statistics |
| 10 | `dashboard_stats` | `onDashboardStats()` | `DashboardStats` | Active / Resolved / Pending counts |
| 11 | `executive_status` | `onExecutiveStatus()` | `ExecutiveStatusUpdate` | Executive online/offline update |
| 12 | `chat_assigned` | `onChatAssigned()` | `ChatAssignment` | Chat assigned to executive |
| 13 | `chat_reassigned` | `onChatReassigned()` | `ChatAssignment` | Chat reassigned to another executive |
| 14 | `sla_alert` | `onSlaAlert()` | `any` | SLA breach alert (toastr notification) |
| 15 | `tag_updated` | `onTagUpdated()` | `TagUpdate` | Tag change sync across clients |
| 16 | `note_added` | `onNoteAdded()` | `InternalNote` | Real-time internal note broadcast |

---

## Summary

| Domain | Protocol | Endpoints |
|--------|----------|-----------|
| `restchatsupport2.oneway.cab` | REST + WebSocket | 10 REST + 13 emit + 16 listen |
| `node.oneway.cab` | REST | 6 |
| `webapi.oneway.cab` | REST | 2 |
| `partnerenrolapi.oneway.cab` | REST | 7 |

**Total: 4 domains, 25 REST endpoints, 29 WebSocket events**

---

## Source Files

| File | Role |
|------|------|
| `src/app/class/api-properties.ts` | Base URL configuration (staging + production) |
| `src/app/service/py-smart-chat.service.ts` | PySmartChat REST calls |
| `src/app/service/chat.service.ts` | WebSocket emit + listen (Socket.IO) |
| `src/app/service/oneway-node.service.ts` | Node Admin REST calls |
| `src/app/service/oneway-web-api.service.ts` | Web API REST calls |
| `src/app/service/oneway-partner-enrol-api.service.ts` | Partner Enrol REST calls |

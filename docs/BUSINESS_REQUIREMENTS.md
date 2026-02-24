# Business Requirements Document (BRD)
## Smart Chat API â€” OneWay.Cab Real-Time Multi-Channel Chat Platform

---

## 1. Executive Summary

**Product Name:** Smart Chat API (Py Smart Chat)
**Business Owner:** OneWay.Cab (Inter-City Cab Service)
**Purpose:** A real-time, multi-channel chat platform that connects OneWay.Cab's customers, drivers (DCO â€” Driver Cab Operators), vendors, and internal support agents via WhatsApp and a live web dashboard. The system handles inbound/outbound WhatsApp messaging, automated promotional workflows (discount codes), live agent-to-customer chat, and real-time operational analytics.

**Why it exists:** OneWay.Cab operates across multiple Indian cities and manages communication with four distinct stakeholder groups â€” Customers, Partners (Drivers), Vendors, and SRDP participants. Each group has a dedicated WhatsApp number. This application centralizes all these conversations into a single system with a real-time dashboard for support agents, automating repetitive tasks (discount campaigns) and enabling human escalation when needed.

---

## 2. Business Context & Problem Statement

### 2.1 The Problem

OneWay.Cab needs to:

1. **Manage multi-channel WhatsApp communication** â€” 6 WhatsApp Business numbers serving different stakeholder groups, each needing its own message routing and response logic.
2. **Provide real-time agent chat** â€” Support agents need a live dashboard to view, respond to, and manage conversations across all channels simultaneously.
3. **Automate promotional workflows** â€” Discount campaigns for specific intercity routes need automated interactive message flows (offer â†’ accept/decline â†’ code delivery).
4. **Track operational metrics** â€” Real-time counts of active vs. resolved chats for operational oversight.
5. **Scale horizontally** â€” The system must run on multiple Kubernetes pods without message duplication or lost state.

### 2.2 The Solution

A FastAPI-based async application that:

- Receives WhatsApp webhooks from the Pinbot API (WhatsApp Business provider)
- Routes messages to the correct business logic based on the incoming channel
- Provides WebSocket endpoints for a real-time agent dashboard
- Uses Redis for cross-pod message broadcasting (Pub/Sub) and atomic dashboard counters
- Stores all chat history in MongoDB
- Sends outbound WhatsApp messages (text, templates, interactive buttons, CTA URLs, media, contact cards)

---

## 3. Stakeholders & User Types

| Stakeholder | Identifier | WhatsApp Number | Communication Channel | Description |
|---|---|---|---|---|
| **Partner (DCO)** | `9099039188`, `8690247247`, `com.oneway.driver` | 919099039188 | `chat` | Drivers/cab operators communicating about rides, issues |
| **Customer** | `8000247247`, `com.onewaycab`, `com.onewaycab.ios` | 919638106888 | `customer_chat_new` | End-users booking cabs, needing support |
| **Vendor** | `9726724247`, `com.onewaycab.vendor` | 919726724247 | `vendor_chat` | Fleet owners managing their vehicles |
| **SRDP** | `9586924247` | 919586924247 | `srdp_chat` | Special Route Delivery Partners |
| **Discount Channel** | `9638120888` | 919638120888 | `discount` | Automated discount campaign (no human agents) |
| **Support Agent** | Internal staff | N/A (uses web dashboard) | WebSocket | Human agents managing conversations via dashboard |

---

## 4. Functional Requirements

### FR-1: WhatsApp Webhook Reception

**What:** Receive inbound WhatsApp messages from Pinbot API via HTTP POST webhooks.
**Why:** Each WhatsApp Business number has a dedicated webhook endpoint so the system can route messages to the correct business logic.

**Endpoints (one per channel):**

| Endpoint | Channel | Behavior |
|---|---|---|
| `POST /api/chats/whatsapp_chat/9638120888` | Discount | Automated discount flow (no human agent) |
| `POST /api/chats/whatsapp_chat/9099039188` | Partner/DCO | Save message, notify agents via WebSocket |
| `POST /api/chats/whatsapp_chat/8000247247` | Customer | Save message, notify agents via WebSocket |

**Webhook payload parsing:** Extract sender phone, sender name, message type (text/button/interactive/media), message content, media metadata from standard WhatsApp webhook JSON structure.

**Processing model:** Return HTTP 200 immediately; process message in background task (non-blocking).

---

### FR-2: Automated Discount Campaign Flow (Discount Channel)

**What:** Fully automated interactive WhatsApp conversation for intercity route discount codes.
**Why:** Drive repeat bookings by offering route-specific discount codes without agent involvement.

**Flow:**

1. Customer messages the discount number
2. System matches message against known discount route patterns (14 supported routes)
3. **If route matched** (e.g., "Need Discount Code - Pune to Mumbai Airport @ 2199"):
   - Send discount text message with code
   - Send interactive CTA URL button linking to OneWay.Cab app
4. **If customer clicks "Yes, Send Discount Code"** button:
   - Send discount code via interactive CTA URL message
5. **If customer clicks "I don't need discount"**:
   - Send follow-up interactive with reason buttons: "Bad Service" / "Prices are High" / "Other Reason"
   - Log response to `no_discount_log` collection for analytics
6. **For unrecognized messages:**
   - Send default care message + OneWay.Cab contact card

**Supported Discount Routes (14 total):**

- Pune to Mumbai Airport @ â‚¹2199
- Nashik to Mumbai Airport @ â‚¹1999
- Bilaspur to Raipur Airport @ â‚¹1499
- Pune to Shirdi @ â‚¹2499
- Mumbai Airport to Pune @ â‚¹2199
- Mumbai Airport to Nashik @ â‚¹1999
- Raipur Airport to Bilaspur @ â‚¹1499
- Shirdi to Pune @ â‚¹2499
- Pune to Lonavala @ â‚¹1299
- Lonavala to Pune @ â‚¹1299
- Mumbai to Pune @ â‚¹2199
- Pune to Mumbai @ â‚¹2199
- Nagpur to Raipur @ â‚¹3499
- Raipur to Nagpur @ â‚¹3499

**Pre-defined discount codes:** Each route has a hardcoded code (e.g., `TRUST4111` for Pune-Mumbai).

**Pre-defined message templates per route:** Each route has a formatted message with header, body (including emoji, discount code, booking instructions), and footer ("Inter-City Experts").

---

### FR-3: Real-Time Agent Chat via WebSocket

**What:** WebSocket-based real-time bidirectional messaging between support agents (web dashboard) and customers (WhatsApp).
**Why:** Agents need to view and respond to customer conversations in real-time across all channels from a single dashboard.

**WebSocket Endpoints:**

- `WS /ws` â€” General connection (dashboard, system events)
- `WS /ws/{chat_id}` â€” Chat-specific connection (auto-joins room)

**Supported Events:**

| Event | Purpose | Key Data |
|---|---|---|
| `config` | Get user configuration | `{sender}` |
| `search_chat` | Find chat by customer phone | `{sender, customer}` |
| `fetch_all_chats` | List chats with filters & pagination | `{status, customer_type, search, page, page_size}` |
| `fetch_chats_by_user` | Get message history for a chat | `{chat_id, page, page_size}` |
| `new_chat` | Create or retrieve existing chat | `{sender, customer_type}` |
| `join_chat` | Join a chat room | `{chat_id, type}` |
| `join_chat_customer` | Join a chat room (customer variant) | `{chat_id, type, customer_type}` |
| `send_message` | Send message (saves + broadcasts + WhatsApp) | `{chat_id, sender, type, message, customer_type}` |
| `leave_chat` | Leave a chat room | `{chat_id}` |
| `update_chat_status` | Change status (active/resolved) | `{customer_number, update_by_number, status}` |

**Agent-to-Customer message flow:**

1. Agent sends message via WebSocket `send_message` event
2. Message saved to MongoDB (pushed to chat's `messages[]` array)
3. Message broadcast to all agents in the same chat room (WebSocket)
4. Message sent to customer via WhatsApp (Pinbot API), routed to correct channel based on `customer_type`:
   - Partner â†’ `chat` send type
   - SRDP (`9586924247`) â†’ `srdp_chat`
   - Vendor (`9726724247`) â†’ `vendor_chat`
   - Other â†’ `customer_chat_new`

**Customer-to-Agent message flow:**

1. Customer sends WhatsApp message
2. Webhook received, message saved to MongoDB
3. WebSocket broadcast to all agents in chat room
4. Dashboard room notified of update via room-specific events:
   - Partner chats â†’ `room_update` event
   - Customer chats â†’ `room_update_customer` event
   - Vendor chats â†’ `room_update_vendor` event
   - SRDP chats â†’ `room_update_srdp` event

**Multi-Pod WebSocket Architecture:**

- Each pod has a unique UUID identifier
- Redis Pub/Sub channel pattern: `ws:chat:{room_id}`
- Messages published to Redis are received by all pods
- Each pod ignores messages originating from itself (pod_id check)
- Connection tracking: in-memory `Dict[connection_id â†’ ConnectionInfo]` per pod
- Room tracking: in-memory `Dict[room_id â†’ Set[connection_ids]]` per pod

---

### FR-4: Chat Lifecycle Management

**What:** Create, track, and resolve customer conversations.
**Why:** Agents need to manage conversation state and track which chats need attention.

**Chat States:** `active` | `resolved`

**Lifecycle:**

1. **Creation:** Auto-created on first message from a customer. Initial status = `active`.
2. **Active:** Appears in agent dashboard's "Active" tab. Messages flow in real-time.
3. **Resolved:** Agent marks chat as resolved. Moves to "Resolved" tab. Can be reopened to `active`.

**Status change triggers:**

- Dashboard counter update (Redis `INCR`/`DECR`)
- WebSocket broadcast to all connected dashboards (`dashboard_stats` event)
- Audit fields updated: `status_updated_by`, `status_updated_at`
- Resolution logged to `chat_resolve_log` collection

**Chat filtering (for agent dashboard):**

- By status: `active` / `resolved`
- By customer type: `Partner` / `Customer` / `Vendor` / `SRDP`
- Special search filters (data joined from `users` collection via aggregation `$lookup`):
  - `Active_Approved` â€” `documents_status = "Approved"` AND `dco_status = "Active"`
  - `Pending` â€” `documents_status = "Pending"`
  - `InJourney` â€” `in_journey_status = true`
  - `Suspend` â€” `dco_status = "Suspend"`

**Pagination:** Offset-based with configurable `page` and `page_size` (default 10).

---

### FR-5: Read Receipts & Message Tracking

**What:** Track which users have seen each message.
**Why:** Agents need to know if messages have been read, and the dashboard shows unseen message counts per chat.

- Each message has a `seen_by[]` array containing user identifiers
- When an agent opens a chat (`fetch_chats_by_user`), all messages are marked as seen by that agent
- Individual message seen status updated via `mark_messages_as_seen(chat_id, sender, message_id)`
- `unseen_count` calculated per chat in MongoDB aggregation pipeline (server-side, not client-side)
- Displayed as badge count in the chat list view

---

### FR-6: Dashboard Statistics (Real-Time)

**What:** Live count of active and resolved chats, updated in real-time.
**Why:** Operational oversight â€” managers need to see current workload at a glance.

**HTTP Endpoint:** `GET /api/dashboard/stats`
**Response:** `{"status": 1, "data": {"active": N, "resolved": M, "pending": 0}}`

**Architecture (event-driven, not polling):**

- Redis atomic counters: `dashboard::count::active`, `dashboard::count::resolved`
- On chat creation: `INCR dashboard::count::active`
- On status change (e.g., active â†’ resolved): `DECR dashboard::count::active`, `INCR dashboard::count::resolved`
- Every counter change triggers WebSocket broadcast (`dashboard_stats` event) to all connected dashboard clients across all pods
- Background sync every 5 minutes from MongoDB to Redis (drift protection)
- HTTP endpoint response cached for 60 seconds in Redis (`dashboard::stats` key)

---

### FR-7: Outbound WhatsApp Messaging

**What:** Send various message types to customers via WhatsApp.
**Why:** Agents reply to customers, system sends automated responses, and campaigns send promotional content.

**Supported message types:**

1. **Text** â€” Plain text messages (`send_whatsapp_msg`)
2. **Template** â€” Pre-approved WhatsApp templates, e.g., `ask_issue_resolved` in Hindi (`send_whatsapp_template`)
3. **Dynamic Template** â€” Templates with runtime body/button parameters (`send_whatsapp_template_dynamic`)
4. **Interactive Buttons** â€” Quick-reply buttons, e.g., Yes/No for issue resolution (`send_issue_resolved_interactive`)
5. **Interactive CTA URL** â€” Click-to-action with app deep link `https://oneway.cab/app` (`send_discount_code_interactive_cta_url`)
6. **Interactive List** â€” Dropdown list selection with sections and rows (`send_dynamic_interactive_list`)
7. **Contact Card** â€” vCard with OneWay.Cab support: email `care@oneway.cab`, company `OneWay.Cab`, website `https://oneway.cab/` (`send_whatsapp_contact_msg`)
8. **Video** â€” Video message with caption (`send_whatsapp_video_msg`)
9. **Media Download** â€” Download customer-sent media from Pinbot API (`get_image_from_whatsapp`)

**Channel routing (phone number â†’ send_type â†’ API URL + API key):**

| WhatsApp Number | Send Type | Pinbot API URL | API Key |
|---|---|---|---|
| 919638120888 | `discount` | `https://partners.pinbot.ai/v2/messages` | `6fe506ff-27f0-11ef-ad4f-92672d2d0c2d` |
| 919099039188 | `chat` | `https://partners.pinbot.ai/v2/messages` | `6fe506ff-27f0-11ef-ad4f-92672d2d0c2d` |
| 919638106888 | `customer_chat` | `https://partners.pinbot.ai/v2/messages` | `6fe506ff-27f0-11ef-ad4f-92672d2d0c2d` |
| 919586924247 | `srdp_chat` | `https://partners.pinbot.ai/v2/messages` | `6fe506ff-27f0-11ef-ad4f-92672d2d0c2d` |
| (vendor) | `vendor_chat` | `https://partnersv1.pinbot.ai/v3/723917954136046/messages` | `91f1a598-5708-11f0-98fc-02c8a5e042bd` |
| (customer new) | `customer_chat_new` | `https://partnersv1.pinbot.ai/v3/687960561072454/messages` | `91f1a598-5708-11f0-98fc-02c8a5e042bd` |
| 8690247247 | DCO new | `https://partnersv1.pinbot.ai/v3/807735062422776/messages` | (per channel) |
| 9726524247 | Vendor alt | `https://partnersv1.pinbot.ai/v3/848476011681897/messages` | (per channel) |
| 9081812247 | SRDP alt | `https://partnersv1.pinbot.ai/v3/827966120400721/messages` | (per channel) |

**Media download URL:** `https://partners.pinbot.ai/v1/downloadmedia/{media_id}`

**Template endpoint:** `GET /api/chats/send_whatsapp_template?to={phone}&name={name}`
Sends the `ask_issue_resolved` template in Hindi to check if customer's issue is resolved.

**Predefined text responses:**

| Key | Response |
|---|---|
| `discount` | Pune-Mumbai discount campaign message |
| `textMsg` | "Currently, we're supporting only text msg." |
| `care_job` | Job application form link + HR contact |
| `unlock_diya` | Festival discount code PROMISE500 (5% off, max â‚¹500) |
| default | "This is an automated number. 24*7 WhatsApp support..." |

---

### FR-8: Webhook Verification & User Updates

**What:** Handle WhatsApp webhook setup verification and external user data updates.
**Why:** WhatsApp requires a challenge-response handshake during webhook configuration. External systems need to notify this app of user profile changes.

- `GET /api/webhook/verify` â€” WhatsApp webhook verification
  - Query params: `hub_mode`, `hub_challenge`, `hub_verify_token`
  - Returns `hub_challenge` as integer if `hub_verify_token` matches `WEBHOOK_VERIFY_TOKEN` setting
- `POST /api/webhook/user/update` â€” Receives user profile updates from external systems
  - Triggers `reload_user_data()` (currently placeholder)

---

### FR-9: Communication Master Webhook Forwarding

**What:** Forward incoming WhatsApp webhook payloads to the Communication Master service.
**Why:** Centralized webhook processing for multi-service logging and event tracking.

- Endpoint: `POST https://communicationmaster.oneway.cab/webhook`
- Called asynchronously from WhatsApp service on inbound webhooks
- Payload: Standard JSON with message data

---

### FR-10: Cache Management

**What:** Clear or delete specific Redis cache entries.
**Why:** Operations/admin need ability to force-refresh cached data.

- `POST /api/chats/clear_cache` â€” Flush entire Redis database
- `POST /api/chats/delete_cache` â€” Delete specific cache key by message identifier
  - Cache key format: `chat_response::{message}`

---

### FR-11: Health Checks

**What:** Kubernetes liveness and readiness probes.
**Why:** Container orchestration needs to know if the app is alive and ready to serve traffic.

- `GET /api/health` â€” Liveness probe: `{"status": 1, "message": "Smart Chat API Running"}`
- `GET /api/health/ready` â€” Readiness probe (checks MongoDB + Redis connectivity)
  - Returns 200 with `{"checks": {"mongodb": "ok", "redis": "ok"}}` if healthy
  - Returns 503 if any dependency is unavailable

---

## 5. Data Model

### 5.1 `chats` Collection (MongoDB)

The primary collection storing all conversations and their messages.

```json
{
  "_id": "ObjectId",
  "customer": "9638120888",
  "customer_name": "John Doe",
  "customer_type": "Partner | Customer | Vendor | SRDP",
  "status": "active | resolved",
  "last_msg_by": "PartnerApp",
  "last_message": "Hello, I need help",
  "last_message_time": "ISODate",
  "status_check_datetime": "ISODate",
  "status_updated_by": "9099039188",
  "status_updated_at": "ISODate",
  "messages": [
    {
      "_id": "ObjectId",
      "sender": "9638120888",
      "type": "Customer | Agent",
      "message": "Hello, I need a ride",
      "message_tag": "discount",
      "datetime": "ISODate",
      "media_type": "image | video | audio | document",
      "media": { "id": "..." },
      "mediaUrl": "https://...",
      "seen_by": ["9099039188", "8000247247"]
    }
  ]
}
```

**Indexes:**
- `{status: 1, customer_type: 1}` â€” Dashboard filtering
- `{customer: 1}` â€” Unique customer lookup
- `{messages.datetime: -1}` â€” Message sorting

### 5.2 `users` Collection

User profiles with driver/vendor status metadata. Joined with `chats` via `$lookup` for dashboard filtering.

```json
{
  "_id": "ObjectId",
  "customer": "9638120888",
  "mobile": "9638120888",
  "documents_status": "Approved | Pending | Rejected",
  "dco_status": "Active | Suspend | Inactive",
  "in_journey_status": true
}
```

**Indexes:**
- `{mobile: 1}` â€” Unique, sparse

### 5.3 `socket_collection`

Tracks which agents are currently viewing which chats (online presence).

```json
{
  "chat_id": "ObjectId_string",
  "join_user": [
    {
      "user_id": "agent_123",
      "socket_id": "uuid-connection-id",
      "last_updated": "ISODate"
    }
  ]
}
```

**Indexes:**
- `{chat_id: 1}`

### 5.4 `chat_resolve_log`

Audit trail for chat resolutions â€” records when chats were resolved and by whom.

### 5.5 `no_discount_log`

Logs when customers decline discount offers. Fields include: `sender`, `text` (reason code: bad_service / prices_high / other), `created_at`.

### 5.6 `discount_code_template`

Stores discount code templates for different routes with route name, code, discount amount, validity dates.

### 5.7 `state_languages`

Maps states/regions to language preferences for localized WhatsApp messaging.

---

## 6. Redis Architecture

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `dashboard::count::active` | Integer | None | Atomic counter for active chats |
| `dashboard::count::resolved` | Integer | None | Atomic counter for resolved chats |
| `dashboard::stats` | JSON String | 60s | Cached dashboard stats HTTP response |
| `chat_response::{message}` | JSON String | 1800s (30min) | Cached chat responses |
| `lock:scheduler:{task_name}` | String (pod_id) | 60-300s | Distributed lock for background tasks |
| `ws:chat:{room_id}` | Pub/Sub Channel | N/A | Cross-pod WebSocket message broadcasting |

**Counter Operations:**
- `INCR dashboard::count::active` â€” On new chat creation
- `DECR dashboard::count::active` â€” When chat moves from active to another status
- `INCR dashboard::count::resolved` â€” When chat is resolved
- Atomic operations prevent race conditions across pods

**Distributed Locking:**
- `SET lock:scheduler:{task_name} {pod_id} NX EX {ttl}` â€” Acquire lock atomically
- Only the pod holding the lock executes the scheduled task
- TTL auto-releases stuck locks if a pod crashes

---

## 7. External Integrations

### 7.1 Pinbot AI (WhatsApp Business API Provider)

- **Message sending (default):** `https://partners.pinbot.ai/v2/messages`
- **Message sending (channel-specific v3):** `https://partnersv1.pinbot.ai/v3/{channel_id}/messages`
- **Media download:** `https://partners.pinbot.ai/v1/downloadmedia/{media_id}`
- **Authentication:** API key in request header (`apikey: {key}`)
- **Protocol:** HTTP/2 with connection pooling
- **Connection pool:** max=100 connections, keepalive=20, expiry=30s
- **Timeout:** 10s total, 5s connect

### 7.2 Communication Master (Internal OneWay.Cab Service)

- **Webhook forwarding:** `POST https://communicationmaster.oneway.cab/webhook`
- **Purpose:** Centralized webhook logging/processing across all OneWay.Cab services

---

## 8. Non-Functional Requirements

### 8.1 Multi-Pod Scalability

- WebSocket messages broadcast across pods via Redis Pub/Sub (channel pattern: `ws:chat:*`)
- Background tasks use Redis distributed locks (`SET NX EX`) â€” only one pod executes at a time
- Each pod generates a unique UUID for lock ownership and message deduplication
- No sticky sessions required for HTTP endpoints; WebSocket reconnects are handled by client

### 8.2 Performance

- Dashboard reads from Redis atomic counters (sub-millisecond), not MongoDB aggregation
- WhatsApp API calls use shared HTTP/2 connection pool (not per-request clients)
- Webhook processing is non-blocking (background tasks via `asyncio.create_task`, immediate 200 response)
- Chat listing uses MongoDB aggregation pipelines with server-side filtering, lookup, and pagination
- Unseen message count calculated server-side in MongoDB aggregation (not Python loop)
- Dashboard stats HTTP response cached for 60 seconds

### 8.3 Background Tasks

| Task | Interval | Lock TTL | Purpose |
|---|---|---|---|
| Counter Sync | 5 minutes | 60s | Sync Redis counters from MongoDB (drift protection) |
| Booking Alerts | 1 hour | 300s | Send vendor booking notifications (placeholder) |

### 8.4 Timezone

- All timestamps stored as UTC in MongoDB
- Converted to IST (Asia/Kolkata, UTC+5:30) for display via `get_ist_datetime()` utility

### 8.5 Logging

- Centralized logging via `setup_logging()`
- Format: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- Level: INFO (production)
- Output: stdout (container-friendly)
- Covers: app lifecycle, database operations, WhatsApp API calls, WebSocket events, background tasks

---

## 9. Technology Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Web Framework | FastAPI | 0.115.0 | Async REST API + WebSocket |
| ASGI Server | Uvicorn | 0.30.6 | Application server |
| Database | MongoDB (Motor) | 3.5.1 | Persistent chat storage |
| Cache / Pub-Sub | Redis (redis-py) | >=5.0.2 | Caching, counters, cross-pod messaging |
| HTTP Client | httpx | 0.28.1 | WhatsApp API calls (HTTP/2) |
| WebSocket | websockets | 12.0 | Real-time bidirectional messaging |
| Configuration | pydantic-settings | 2.4.0 | Environment-based settings |
| Timezone | pytz | 2024.2 | UTC to IST conversion |
| Container | Docker | Python 3.14.3-slim | Deployment packaging |
| Orchestration | Kubernetes (AWS EKS) | â€” | Horizontal scaling |
| CI/CD | Jenkins | â€” | Build + deploy pipeline |
| Cloud | AWS (ECR, EKS) | ap-south-1 | Container registry + cluster |
| Source Control | Bitbucket | â€” | Git repository |

---

## 10. Configuration & Environment Variables

### 10.1 Application Settings

| Setting | Default Value | Source | Description |
|---|---|---|---|
| `APP_NAME` | "Smart Chat API" | Hardcoded | Application display name |
| `DEBUG` | `False` | `.env` | Debug mode toggle |
| `HOST` | `0.0.0.0` | `.env` | Bind address |
| `PORT` | `5000` | `.env` | Bind port |
| `SECRET_KEY` | `supersecretkey` | `.env` | Application secret |
| `WEBHOOK_VERIFY_TOKEN` | (empty) | `.env` | WhatsApp webhook verification token |

### 10.2 MongoDB Settings

| Setting | Default Value | Description |
|---|---|---|
| `MONGO_USER` | `.env` | Database username |
| `MONGO_PASSWORD` | `.env` | Database password |
| `MONGO_HOST` | `13.234.98.188` | MongoDB server IP |
| `MONGO_PORT` | `27017` | MongoDB port |
| `MONGO_DB` | `chat_system` | Database name |
| Connection Pool Min | `10` | Minimum connections |
| Connection Pool Max | `50` | Maximum connections |
| Server Selection Timeout | `5000ms` | Connection timeout |

### 10.3 Redis Settings

| Setting | Default Value | Description |
|---|---|---|
| `REDIS_HOST` | `172.17.1.143` | Redis server IP |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DB` | `0` | Redis database number |

### 10.4 WhatsApp Settings

| Setting | Source | Description |
|---|---|---|
| `WA_API_KEY_1` | `.env` | Primary Pinbot API key |
| `WA_API_KEY_2` | `.env` | Secondary Pinbot API key |
| `WA_NUMBER_DISCOUNT` | `.env` | Discount channel number (919638120888) |
| `WA_NUMBER_CHAT` | `.env` | DCO chat number (919099039188) |
| `WA_NUMBER_CUSTOMER_CHAT` | `.env` | Customer chat number (919638106888) |
| `WA_NUMBER_SRDP_CHAT` | `.env` | SRDP chat number (919586924247) |

---

## 11. Deployment Architecture

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚  Pinbot API  â”‚ (WhatsApp Business)
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                           â”‚ Webhooks (HTTPS POST)
                    â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚  AWS ALB /   â”‚
                    â”‚  Ingress     â”‚
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚            â”‚            â”‚
        â”Œâ”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”
        â”‚  Pod A   â”‚ â”‚  Pod B   â”‚ â”‚  Pod C   â”‚  (FastAPI + Uvicorn)
        â”‚  (UUID-a)â”‚ â”‚  (UUID-b)â”‚ â”‚  (UUID-c)â”‚
        â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
             â”‚             â”‚            â”‚
        â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”
        â”‚              Redis                  â”‚  (Pub/Sub + Counters + Cache)
        â”‚   172.17.1.143:6379                 â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â”‚
        â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚            MongoDB                  â”‚  (Chat storage)
        â”‚   13.234.98.188:27017              â”‚
        â”‚   Database: chat_system            â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 11.1 CI/CD Pipeline (Jenkins)

1. Authenticate to AWS EKS + ECR (`ap-south-1`)
2. Checkout from Bitbucket repository (branch: `feature/opt_production`)
3. Generate `.env` from Jenkins credentials store
4. Build Docker image (Python 3.14.3-slim base), tag with timestamp (`yyyyMMdd-HHmmss`)
5. Push to ECR: `022300482696.dkr.ecr.ap-south-1.amazonaws.com/py-smart-chat`
6. Update EKS deployment (`py-smart-chat` namespace) with new image

### 11.2 Docker Configuration

- Base image: `python:3.14.3-slim`
- Build deps: `gcc` (for compiled packages)
- Single uvicorn worker (scaling via Kubernetes replicas)
- Health check: `HTTP GET /api/health`
- Exposed port: `5000`

---

## 12. Application Lifecycle

### 12.1 Startup Sequence

1. Connect to MongoDB (Motor async pool: min=10, max=50)
2. Connect to Redis (main client + separate Pub/Sub client)
3. Create database indexes on `chats`, `users`, `socket_collection`
4. Initialize shared httpx `AsyncClient` (HTTP/2, connection pooling)
5. Sync dashboard counters from MongoDB â†’ Redis (`sync_counters_from_db`)
6. Start WebSocket Pub/Sub listener (`asyncio.create_task`)
7. Start background tasks: counter sync (5min), booking alerts (1hr)
8. Log: "Smart Chat API Running on 0.0.0.0:5000"

### 12.2 Shutdown Sequence

1. Cancel all background tasks
2. Cancel Pub/Sub listener task
3. Close httpx `AsyncClient`
4. Close Redis connections
5. Close MongoDB connection pool

---

## 13. Utility Functions

| Function | Location | Purpose |
|---|---|---|
| `get_send_type(chat_number)` | `global_utils.py` | Map phone number â†’ WhatsApp channel send_type |
| `get_room_update_details(customer_type)` | `global_utils.py` | Get WebSocket room event name for broadcast |
| `get_customer_chat_type(customer_type)` | `global_utils.py` | Get list of identifiers for a customer type |
| `get_chat_display_number(customer_type)` | `global_utils.py` | Format phone number for display |
| `get_ist_datetime(dt)` | `global_utils.py` | Convert UTC datetime to IST formatted string |
| `validate_key(obj, key, type)` | `global_utils.py` | Validate JSON keys in webhook payloads |
| `whatsapp_webhook_data(data)` | `global_utils.py` | Parse WhatsApp webhook JSON structure â†’ (sender, name, msg_type, message, button_reply_id, interactive_reply_id, media_type, media) |

---

## 14. Key Data Flows

### 14.1 Inbound WhatsApp â†’ Agent Dashboard

```
Customer (WhatsApp) â†’ Pinbot API â†’ POST /api/chats/whatsapp_chat/{channel}
  â†’ Parse webhook payload (whatsapp_webhook_data)
  â†’ Background task:
      â†’ check_save_chat() â€” create/retrieve chat
      â†’ save_message() â€” push to messages[] array
      â†’ mark_messages_as_seen() â€” update seen_by
      â†’ WebSocket broadcast to chat room ("new_message")
      â†’ WebSocket broadcast to dashboard room ("room_update_{type}")
      â†’ Forward to Communication Master webhook
```

### 14.2 Agent Dashboard â†’ Customer (WhatsApp)

```
Agent (WebSocket) â†’ "send_message" event
  â†’ validate_chat_id()
  â†’ get_customer_number_from_chat()
  â†’ save_message() â€” push to messages[] array
  â†’ send_whatsapp_msg(to, message, send_type) â†’ Pinbot API â†’ Customer (WhatsApp)
  â†’ broadcast_to_room(chat_id, "new_message", data)
      â†’ Local connections receive directly
      â†’ Redis Pub/Sub â†’ Other pods â†’ Their local connections
```

### 14.3 Chat Status Change â†’ Dashboard Update

```
Agent (WebSocket) â†’ "update_chat_status" event
  â†’ update_chat_status(customer_number, new_status)
      â†’ MongoDB: update status, status_updated_by, status_updated_at
      â†’ on_status_changed(old_status, new_status)
          â†’ DECR dashboard::count::{old_status}
          â†’ INCR dashboard::count::{new_status}
          â†’ _broadcast() â†’ get_counts() from Redis
          â†’ broadcast_to_room("dashboard", "dashboard_stats", counts)
              â†’ All dashboard WebSocket clients updated in real-time
```

### 14.4 Discount Campaign Flow

```
Customer â†’ WhatsApp message to 919638120888
  â†’ POST /api/chats/whatsapp_chat/9638120888
  â†’ Parse: sender, message, msg_type
  â†’ Route by content:
      â”œâ”€ Matches route pattern â†’ send discount text + CTA URL
      â”œâ”€ Button "Yes, Send Discount Code" â†’ send CTA URL with code
      â”œâ”€ Button "I don't need discount" â†’ send reason buttons
      â”œâ”€ Reason selected â†’ log to no_discount_log
      â””â”€ Unrecognized â†’ send care message + contact card
```

---

## 15. Known Limitations & Risks

| # | Issue | Impact | Severity |
|---|---|---|---|
| 1 | Messages stored as unbounded array in chat document | MongoDB 16MB document limit can be exceeded for long-running chats, causing `DocumentTooLarge` error | **High** |
| 2 | No authentication on API or WebSocket endpoints | Anyone can access all endpoints, read all chats, send messages | **High** |
| 3 | WhatsApp API keys partially hardcoded in source code | Security risk if code repository is exposed | **Medium** |
| 4 | Webhook verify token can be empty string | Webhook endpoints not properly secured against unauthorized POST requests | **Medium** |
| 5 | No rate limiting on any endpoint | Vulnerable to abuse and DDoS | **Medium** |
| 6 | CORS set to allow all origins (`*`) | Cross-origin security gap | **Low** |
| 7 | Booking alerts task is placeholder (not implemented) | No vendor booking notifications yet | **Low** |
| 8 | `reload_user_data()` is placeholder (not implemented) | User profile sync from external systems not functional | **Low** |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **DCO** | Driver Cab Operator â€” a partner driver on the OneWay.Cab platform |
| **SRDP** | Special Route Delivery Partner |
| **Pinbot** | Third-party WhatsApp Business API provider (`partners.pinbot.ai`) |
| **CTA URL** | Call-to-Action URL â€” WhatsApp interactive message with a clickable link button |
| **Pub/Sub** | Redis Publish/Subscribe â€” messaging pattern used for cross-pod WebSocket broadcasting |
| **IST** | Indian Standard Time (UTC+5:30) |
| **Motor** | Async MongoDB driver for Python (built on PyMongo) |
| **EKS** | Amazon Elastic Kubernetes Service |
| **ECR** | Amazon Elastic Container Registry |
| **ALB** | Application Load Balancer (AWS) |

---

## 17. Project File Structure

```
py_smart_chat/
â”œâ”€â”€ main.py                           # Entry point â€” uvicorn server startup
â”œâ”€â”€ requirements.txt                  # Python dependencies
â”œâ”€â”€ Dockerfile                        # Container image (Python 3.14.3-slim)
â”œâ”€â”€ Jenkinsfile                       # CI/CD pipeline for AWS EKS
â”œâ”€â”€ .env.example                      # Environment variables template
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ __init__.py                   # FastAPI app factory + lifespan management
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”œâ”€â”€ settings.py               # Pydantic settings (DB, Redis, auth)
â”‚   â”‚   â”œâ”€â”€ database.py               # MongoDB async connection (Motor)
â”‚   â”‚   â”œâ”€â”€ redis_client.py           # Redis client + cache helpers
â”‚   â”‚   â””â”€â”€ logging_config.py         # Centralized logging
â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â””â”€â”€ __init__.py               # MongoDB collection refs + index creation
â”‚   â”œâ”€â”€ routers/
â”‚   â”‚   â”œâ”€â”€ health_router.py          # /api/health endpoints
â”‚   â”‚   â”œâ”€â”€ chat_router.py            # WhatsApp webhooks + chat endpoints
â”‚   â”‚   â”œâ”€â”€ dashboard_router.py       # /api/dashboard stats
â”‚   â”‚   â”œâ”€â”€ webhook_router.py         # Webhook verify + user updates
â”‚   â”‚   â””â”€â”€ websocket_router.py       # WebSocket endpoints
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ chat_service.py           # Chat CRUD + message persistence
â”‚   â”‚   â”œâ”€â”€ whatsapp_service.py       # Pinbot API client + message sending
â”‚   â”‚   â”œâ”€â”€ dashboard_counters.py     # Redis atomic counters (active/resolved)
â”‚   â”‚   â”œâ”€â”€ dashboard_service.py      # Dashboard stats aggregation
â”‚   â”‚   â”œâ”€â”€ scheduler.py              # Background asyncio tasks + distributed locks
â”‚   â”‚   â”œâ”€â”€ schedule_service.py       # Scheduled task logic (vendor alerts)
â”‚   â”‚   â””â”€â”€ webhook_service.py        # Webhook handlers
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â””â”€â”€ global_utils.py           # Utility functions (datetime, routing, validation)
â”‚   â”œâ”€â”€ websockets/
â”‚   â”‚   â”œâ”€â”€ manager.py                # WebSocket manager + Redis Pub/Sub
â”‚   â”‚   â””â”€â”€ events.py                 # WebSocket event handlers
â”‚   â””â”€â”€ commons/
â”‚       â””â”€â”€ classes/                  # Common data classes (placeholder)
```

---

*This document provides a complete specification for recreating the Smart Chat API application. All endpoints, data models, business flows, integrations, and deployment details are captured to enable faithful reproduction of the system.*

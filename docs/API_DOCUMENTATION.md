# Smart Chat v2 — Frontend API Developer Documentation

> **Version:** 2.0
> **Base URL:** `https://<host>:5000`
> **WebSocket URL:** `wss://<host>:5000/ws`
> **Protocol:** REST (JSON) + Socket.IO
> **Last Updated:** 2026-02-23

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [REST API Endpoints](#2-rest-api-endpoints)
   - [Health](#21-health)
   - [Auth](#22-auth)
   - [Chats](#23-chats)
   - [Dashboard](#24-dashboard)
   - [Executives](#25-executives)
   - [Service Window](#26-service-window)
3. [WebSocket (Socket.IO) Events](#3-websocket-socketio-events)
   - [Connection Setup](#31-connection-setup)
   - [Client-Emitted Events](#32-client-emitted-events)
   - [Server-Broadcast Events](#33-server-broadcast-events-listen-only)
4. [Enums & Constants](#4-enums--constants)
5. [Error Handling](#5-error-handling)

---

## 1. Authentication

All protected endpoints require a **JWT Bearer token** in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

WebSocket connections pass the token via the Socket.IO `auth` option (see [Section 3.1](#31-connection-setup)).

**Token lifetime:** 24 hours (access), 7 days (refresh).

---

## 2. REST API Endpoints

### 2.1 Health

---

#### `GET /api/health`

Check if the API server is running. **No auth required.**

**Request:** _None_

**Response:**

```json
{
  "status": 1,
  "message": "Smart Chat API v2 Running",
  "version": "2.0"
}
```

| Field     | Type   | Description                                                               |
|-----------|--------|---------------------------------------------------------------------------|
| `status`  | int    | `1` = success. Standard status flag across all API responses.             |
| `message` | string | Human-readable server status.                                             |
| `version` | string | API version string. Use this to verify the frontend is targeting the correct backend version. |

---

#### `GET /api/health/ready`

Deep health check — verifies MongoDB and Redis connectivity. Use this for load-balancer readiness probes or to show a "system status" indicator in the UI. **No auth required.**

**Request:** _None_

**Response:**

```json
{
  "status": 1,
  "message": "Ready",
  "checks": {
    "mongodb": "ok",
    "redis": "ok"
  }
}
```

| Field            | Type   | Description                                                                |
|------------------|--------|----------------------------------------------------------------------------|
| `status`         | int    | `1` = all services healthy, `0` = at least one service is down.           |
| `message`        | string | `"Ready"` or `"Not Ready"`.                                               |
| `checks.mongodb` | string | `"ok"` or `"error"`. Indicates MongoDB connection health.                  |
| `checks.redis`   | string | `"ok"` or `"error"`. Indicates Redis connection health.                    |

---

### 2.2 Auth

---

#### `POST /api/auth/login`

Authenticate an executive and obtain JWT tokens. **No auth required.**
Rate limit: **10 requests/minute**.

**Request Body:**

```json
{
  "username": "agent_john",
  "password": "s3cret",
  "login_from": "web_dashboard"
}
```

| Field        | Type   | Required | Description                                                                                          |
|--------------|--------|----------|------------------------------------------------------------------------------------------------------|
| `username`   | string | Yes      | The executive's login username. Validated against the external auth service at `node.oneway.cab`.     |
| `password`   | string | Yes      | The executive's password.                                                                            |
| `login_from` | string | Yes      | Identifies the client application making the request (e.g., `"web_dashboard"`, `"mobile_app"`). Stored in the JWT so the backend can differentiate sessions originating from different platforms. |

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agentNumber": "919876543210",
  "adminid": "admin_001"
}
```

| Field          | Type   | Description                                                                                        |
|----------------|--------|----------------------------------------------------------------------------------------------------|
| `accessToken`  | string | Short-lived JWT (24h). Include as `Bearer` token in all subsequent REST requests and WebSocket auth.|
| `refreshToken` | string | Long-lived JWT (7 days). Use to obtain a new `accessToken` without re-entering credentials.        |
| `agentNumber`  | string | The phone number associated with this executive. Used as the executive's identifier in chat events. |
| `adminid`      | string | Admin identifier from the external auth system. May be needed for admin-level operations.          |

**JWT Payload (decoded `accessToken`):**

```json
{
  "sub": "agent_john",
  "role": "executive",
  "agent_number": "919876543210",
  "admin_id": "admin_001",
  "login_from": "web_dashboard",
  "exp": 1740412800
}
```

| Claim          | Description                                                                    |
|----------------|--------------------------------------------------------------------------------|
| `sub`          | Username (subject). Primary user identifier.                                   |
| `role`         | User's role from the external auth system (e.g., `"executive"`, `"admin"`).    |
| `agent_number` | Executive's phone number.                                                      |
| `admin_id`     | Admin identifier.                                                              |
| `login_from`   | Client platform that initiated the login.                                      |
| `exp`          | Unix timestamp when this token expires.                                        |

**Error Responses:**

| Status | Body                                                        | When                              |
|--------|-------------------------------------------------------------|-----------------------------------|
| 400    | `{ "status": 0, "message": "Missing required fields" }`    | `username` or `password` missing. |
| 502    | `{ "status": 0, "message": "Authentication service unavailable" }` | External auth API is down.  |

---

### 2.3 Chats

All chat endpoints require **JWT auth** and have a rate limit of **100 requests/minute** unless noted.

---

#### `GET /api/chats/send_whatsapp_template`

Send a pre-defined WhatsApp template message (e.g., "issue resolved?" prompt) to a customer. Used when an executive wants to proactively reach out.

**Query Parameters:**

| Param  | Type   | Required | Description                                                                                       |
|--------|--------|----------|---------------------------------------------------------------------------------------------------|
| `to`   | string | Yes      | Customer's phone number in international format (e.g., `"919876543210"`). This is the WhatsApp recipient. |
| `name` | string | Yes      | Customer's display name. Inserted into the template greeting so the message feels personalized.   |

**Response:**

```json
{
  "status": 1,
  "message": "Template sent"
}
```

| Field     | Type   | Description                                                    |
|-----------|--------|----------------------------------------------------------------|
| `status`  | int    | `1` = template sent successfully, `0` = delivery failed.      |
| `message` | string | Result description.                                            |

---

#### `GET /api/chats/tags`

Fetch the list of available tags for a given customer type. Tags are used to categorize and filter active chats (e.g., "Payment Issue", "Booking Query").

**Query Parameters:**

| Param           | Type   | Required | Description                                                                                                 |
|-----------------|--------|----------|-------------------------------------------------------------------------------------------------------------|
| `customer_type` | string | Yes      | One of `"Partner"`, `"Customer"`, `"Vendor"`, `"SRDP"`. Each customer type has its own set of predefined tags. |

**Response:**

```json
{
  "status": 1,
  "tags": ["Payment Issue", "Booking Query", "Cancellation", "Feedback"]
}
```

| Field  | Type     | Description                                                                              |
|--------|----------|------------------------------------------------------------------------------------------|
| `status` | int    | `1` = success.                                                                           |
| `tags` | string[] | Array of tag labels. Display these as selectable chips/badges in the chat UI.             |

**Rationale:** Tags differ by customer type because Partners, Customers, Vendors, and SRDP users have distinct support categories and workflows.

---

#### `POST /api/chats/{chat_id}/rate`

Submit a rating for a completed chat session. Allows executives or supervisors to rate conversation quality.

**Path Parameters:**

| Param     | Type   | Description                                           |
|-----------|--------|-------------------------------------------------------|
| `chat_id` | string | MongoDB ObjectId of the chat being rated.             |

**Request Body:**

```json
{
  "executive_id": "agent_john",
  "rating": 4
}
```

| Field          | Type   | Required | Description                                                                                      |
|----------------|--------|----------|--------------------------------------------------------------------------------------------------|
| `executive_id` | string | Yes      | Identifier of the executive who is submitting the rating. Enables per-executive rating analytics. |
| `rating`       | int    | Yes      | Score from `1` (poor) to `5` (excellent). Measures customer service quality for reporting.        |

**Response:**

```json
{
  "status": 1,
  "message": "Rating saved"
}
```

---

#### `POST /api/chats/clear_cache`

Flush the entire server-side cache. **Admin-only** — requires a special admin token header in addition to JWT.
Rate limit: **5 requests/minute**.

**Headers:**

| Header         | Type   | Required | Description                                              |
|----------------|--------|----------|----------------------------------------------------------|
| `X-Admin-Token`| string | Yes      | Must match the server's `ADMIN_TOKEN` config value.      |

**Response:**

```json
{
  "status": 1,
  "message": "Cache cleared"
}
```

---

#### `POST /api/chats/delete_cache`

Delete a specific cache key. Useful for forcing a refresh of a particular cached resource.

**Request Body:**

```json
{
  "message": "v2:service_window::closed::Partner"
}
```

| Field     | Type   | Required | Description                                                          |
|-----------|--------|----------|----------------------------------------------------------------------|
| `message` | string | Yes      | The exact Redis cache key to delete. Prefix with `v2:` as needed.    |

**Response:**

```json
{
  "status": 1,
  "message": "Cache key deleted"
}
```

---

### 2.4 Dashboard

---

#### `GET /api/dashboard/stats`

Fetch aggregate statistics for the dashboard. Cached server-side for **60 seconds** to reduce database load.

**Response:**

```json
{
  "status": 1,
  "data": {
    "active": 42,
    "resolved": 187,
    "awaiting_customer_response": 8
  }
}
```

| Field                            | Type | Description                                                                                              |
|----------------------------------|------|----------------------------------------------------------------------------------------------------------|
| `data.active`                    | int  | Number of currently active (open) chats across all customer types. Drives the "Active Chats" counter.    |
| `data.resolved`                  | int  | Number of resolved (closed) chats. Drives the "Resolved" counter.                                        |
| `data.awaiting_customer_response`| int  | Chats tagged "Awaiting Customer Response" — the executive replied and is waiting for the customer. Helps prioritize workload. |

**Rationale:** These three counters give executives and supervisors a quick operational overview. The `awaiting_customer_response` count is especially useful because those chats don't need immediate executive attention.

---

### 2.5 Executives

---

#### `POST /api/executives/status`

Set an executive's online/offline status. When going offline, the executive's assigned chats are redistributed to other online executives.

**Request Body:**

```json
{
  "executive_id": "agent_john",
  "status": "online",
  "customer_type": "Partner"
}
```

| Field           | Type   | Required | Description                                                                                                           |
|-----------------|--------|----------|-----------------------------------------------------------------------------------------------------------------------|
| `executive_id`  | string | Yes      | Unique identifier for the executive (typically their username).                                                        |
| `status`        | string | Yes      | `"online"` or `"offline"`. Controls whether this executive receives new chat assignments via round-robin.             |
| `customer_type` | string | Yes      | `"Partner"` / `"Customer"` / `"Vendor"` / `"SRDP"`. Executives are slotted into customer-type-specific queues, so a Partner executive only receives Partner chats. |

**Response:**

```json
{
  "status": 1,
  "message": "Status updated"
}
```

---

#### `GET /api/executives/online`

Get a list of all currently online executives for a given customer type. Useful for showing who is available or for manual chat reassignment.

**Query Parameters:**

| Param           | Type   | Required | Description                                                  |
|-----------------|--------|----------|--------------------------------------------------------------|
| `customer_type` | string | Yes      | Filter by customer type. Only shows executives in this queue.|

**Response:**

```json
{
  "status": 1,
  "executives": [
    {
      "id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "executive_id": "agent_john",
      "status": "online",
      "customer_type": "Partner",
      "last_activity": "2026-02-23T14:30:00"
    },
    {
      "id": "65a1b2c3d4e5f6a7b8c9d0e2",
      "executive_id": "agent_jane",
      "status": "online",
      "customer_type": "Partner",
      "last_activity": "2026-02-23T14:28:15"
    }
  ]
}
```

| Field                  | Type   | Description                                                                                            |
|------------------------|--------|--------------------------------------------------------------------------------------------------------|
| `executives[].id`      | string | MongoDB document ID for this executive record.                                                         |
| `executives[].executive_id` | string | The executive's username/identifier. Use this when emitting WebSocket events.                    |
| `executives[].status`  | string | Always `"online"` in this response (offline executives are excluded).                                  |
| `executives[].customer_type` | string | The customer type queue this executive belongs to.                                               |
| `executives[].last_activity` | string | ISO 8601 timestamp of the executive's last action. Useful for detecting idle executives in the UI. |

---

### 2.6 Service Window

WhatsApp enforces a **24-hour service window** — you can only send free-form messages within 24 hours of the customer's last inbound message. These endpoints help identify customers whose window is closing or closed.

---

#### `GET /api/service-window/closed`

Get customers whose 24-hour WhatsApp service window has expired (last inbound message >23 hours ago). The 23-hour threshold gives a 1-hour buffer before the window fully closes.

**Query Parameters:**

| Param           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `customer_type` | string | Yes      | Filter by customer type.                 |

**Response:**

```json
{
  "status": 1,
  "count": 3,
  "customers": [
    {
      "customer": "919876543210",
      "customer_name": "Rahul Sharma",
      "last_incoming_whatsapp_message": "2026-02-22T10:15:00",
      "customer_type": "Partner"
    }
  ]
}
```

| Field                                   | Type        | Description                                                                                              |
|-----------------------------------------|-------------|----------------------------------------------------------------------------------------------------------|
| `count`                                 | int         | Total number of customers with a closed window.                                                          |
| `customers[].customer`                  | string      | Customer's phone number. This is the primary customer identifier throughout the system.                  |
| `customers[].customer_name`             | string/null | Display name (from WhatsApp profile or manual entry). May be `null` for unknown contacts.                |
| `customers[].last_incoming_whatsapp_message` | string | ISO 8601 timestamp of the customer's last inbound WhatsApp message. The window expires 24h after this.   |
| `customers[].customer_type`             | string      | The customer segment this person belongs to.                                                             |

**Rationale:** Executives need to know which customers they can no longer message freely. For closed-window customers, only pre-approved WhatsApp template messages can be sent.

---

#### `GET /api/service-window/upcoming-rides`

Get closed-window customers who have a ride scheduled within the next **4 hours**. These are high-priority because the customer may need support but the executive can't send free-form messages.

**Query Parameters:**

| Param           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `customer_type` | string | Yes      | Filter by customer type.                 |

**Response:**

```json
{
  "status": 1,
  "count": 1,
  "customers": [
    {
      "customer": "919876543210",
      "customer_name": "Rahul Sharma",
      "last_incoming_whatsapp_message": "2026-02-22T10:15:00",
      "next_ride_datetime": "2026-02-23T16:00:00",
      "booking_id": "BK-20260223-001",
      "ride_status": "upcoming"
    }
  ]
}
```

| Field                      | Type        | Description                                                                                                    |
|----------------------------|-------------|----------------------------------------------------------------------------------------------------------------|
| `customers[].next_ride_datetime` | string/null | ISO 8601 timestamp of the customer's next scheduled ride. `null` if no ride is found.                    |
| `customers[].booking_id`   | string/null | Booking reference ID. Display alongside the ride info so executives can quickly look it up.                    |
| `customers[].ride_status`  | string/null | Current status of the ride (e.g., `"upcoming"`, `"completed"`).                                                |

**Rationale:** A customer with an imminent ride and a closed service window is a high-risk situation — if something goes wrong with the ride, the executive can't proactively reach out. The UI should highlight these customers prominently so executives can send a template message to re-open the window.

---

## 3. WebSocket (Socket.IO) Events

### 3.1 Connection Setup

**Transport:** Socket.IO (not raw WebSocket)
**Namespace:** Default (`/`)
**Path:** `/ws`

**Connection Example (JavaScript):**

```javascript
import { io } from "socket.io-client";

const socket = io("https://<host>:5000", {
  path: "/ws",
  auth: {
    token: "<access_token>"
  },
  transports: ["websocket"]  // skip polling, go straight to WebSocket
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
  // Likely an invalid or expired token — redirect to login
});
```

**Authentication:** The server validates the JWT from `auth.token` before accepting the connection. If the token is invalid or expired, the connection is rejected with a `connect_error` event.

**Rooms (auto-joined by server based on events):**

| Room Name       | Who Joins                             | Purpose                                    |
|-----------------|---------------------------------------|--------------------------------------------|
| `<chat_id>`     | Executives viewing a specific chat    | Receive real-time messages for that chat    |
| `PartnerApp`    | Executives on the Partner dashboard   | Receive Partner chat list updates           |
| `CustomerApp`   | Executives on the Customer dashboard  | Receive Customer chat list updates          |
| `VendorApp`     | Executives on the Vendor dashboard    | Receive Vendor chat list updates            |
| `SRDPApp`       | Executives on the SRDP dashboard      | Receive SRDP chat list updates              |
| `dashboard`     | All dashboard viewers                 | Receive aggregate stats and SLA alerts      |

---

### 3.2 Client-Emitted Events

For every event the client emits, the server responds with a corresponding `<event_name>_response` event.

---

#### `config`

Fetch a customer's profile/configuration data from the `users` collection. Use this when opening a chat to display customer details.

**Emit:**

```json
{
  "sender": "919876543210"
}
```

| Field    | Type   | Required | Description                                                                              |
|----------|--------|----------|------------------------------------------------------------------------------------------|
| `sender` | string | Yes      | Customer's phone number. The system looks this up in the `users` collection to fetch their profile data (e.g., name, account details, preferences). |

**Listen:** `config_response`

```json
{
  "status": 1,
  "config": {
    "customer": "919876543210",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "city": "Ahmedabad"
  }
}
```

| Field    | Type        | Description                                                                               |
|----------|-------------|-------------------------------------------------------------------------------------------|
| `status` | int         | `1` = found, `0` = not found.                                                            |
| `config` | object/null | Full user document from the database. Fields vary by customer type and data availability. |

---

#### `search_chat`

Search for an existing chat by customer phone number. Useful for a "search customer" feature — quickly jump to a customer's chat.

**Emit:**

```json
{
  "customer": "919876543210"
}
```

| Field      | Type   | Required | Description                                                             |
|------------|--------|----------|-------------------------------------------------------------------------|
| `customer` | string | Yes      | Customer phone number to search for. Matches against the `customer` field in chats. |

**Listen:** `search_chat_response`

```json
{
  "status": 1,
  "chat": {
    "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "customer": "919876543210",
    "customer_name": "Rahul Sharma",
    "status": "active",
    "is_resolved": false
  }
}
```

| Field                  | Type    | Description                                                                         |
|------------------------|---------|-------------------------------------------------------------------------------------|
| `chat.chat_id`        | string  | Unique chat identifier. Use this to join the chat room and fetch messages.          |
| `chat.customer`       | string  | Customer phone number.                                                               |
| `chat.customer_name`  | string/null | Customer display name.                                                           |
| `chat.status`         | string  | `"active"` or `"resolved"`.                                                         |
| `chat.is_resolved`    | boolean | Convenience flag — `true` when `status === "resolved"`.                             |

---

#### `fetch_all_chats`

Fetch a paginated, filterable list of chats for the dashboard/sidebar. This is the primary event for populating the chat list.

**Emit:**

```json
{
  "status": "active",
  "customer_type": "Partner",
  "search": "Rahul",
  "tag": "Payment Issue",
  "page": 1,
  "page_size": 10,
  "sender": "agent_john",
  "assigned_executive_id": "agent_john"
}
```

| Field                    | Type   | Required | Default | Description                                                                                                                      |
|--------------------------|--------|----------|---------|----------------------------------------------------------------------------------------------------------------------------------|
| `status`                 | string | No       | —       | Filter by chat status: `"active"` or `"resolved"`. Omit to fetch both.                                                          |
| `customer_type`          | string | No       | —       | Filter by customer segment. Executives typically work within one segment at a time.                                              |
| `search`                 | string | No       | —       | Free-text search against `customer` (phone) and `customer_name`. Enables the search bar in the chat list.                        |
| `tag`                    | string | No       | —       | Filter chats by a specific tag. Shows only chats that have this tag applied.                                                     |
| `page`                   | int    | No       | `1`     | Page number for pagination.                                                                                                      |
| `page_size`              | int    | No       | `10`    | Number of chats per page.                                                                                                        |
| `sender`                 | string | No       | —       | Executive's ID. When provided, the response includes `unseen_count` — the number of messages in each chat not yet seen by this executive. Powers the unread badge. |
| `assigned_executive_id`  | string | No       | —       | Filter to show only chats assigned to this executive. Use for "My Chats" view.                                                   |

**Listen:** `fetch_all_chats_response`

```json
{
  "status": 1,
  "chats": [
    {
      "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "customer": "919876543210",
      "customer_name": "Rahul Sharma",
      "customer_type": "Partner",
      "status": "active",
      "is_resolved": false,
      "last_message": "I need help with my booking",
      "last_message_time": "2026-02-23T14:30:00",
      "last_incoming_message": "2026-02-23T14:30:00",
      "last_incoming_whatsapp_message": "2026-02-23T14:30:00",
      "last_outgoing_message": "2026-02-23T14:25:00",
      "last_interaction_by": "Customer",
      "tags": ["Booking Query"],
      "assigned_executive_id": "agent_john",
      "unseen_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

| Field                              | Type        | Description                                                                                                             |
|------------------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------|
| `chats[].chat_id`                  | string      | Unique chat identifier.                                                                                                 |
| `chats[].customer`                 | string      | Customer's phone number. The primary customer identifier across the entire system.                                      |
| `chats[].customer_name`            | string/null | Customer's display name from their WhatsApp profile or CRM data.                                                        |
| `chats[].customer_type`            | string      | Customer segment: `"Partner"`, `"Customer"`, `"Vendor"`, or `"SRDP"`. Determines which dashboard tab this chat appears in. |
| `chats[].status`                   | string      | `"active"` = open and needs attention; `"resolved"` = closed.                                                           |
| `chats[].is_resolved`              | boolean     | Convenience boolean — `true` when status is `"resolved"`.                                                               |
| `chats[].last_message`             | string/null | Preview text of the most recent message. Display as a snippet under the customer name in the chat list.                 |
| `chats[].last_message_time`        | string/null | ISO 8601 timestamp of the most recent message. Use for sorting and displaying "5 min ago" labels.                       |
| `chats[].last_incoming_message`    | string/null | Timestamp of the last message from the customer (any channel). Used for SLA calculations — time since the customer last wrote. |
| `chats[].last_incoming_whatsapp_message` | string/null | Timestamp of the last WhatsApp message from the customer. Specifically tracks WhatsApp for the 24h service window calculation. |
| `chats[].last_outgoing_message`    | string/null | Timestamp of the last message sent by an executive. Helps determine response time.                                      |
| `chats[].last_interaction_by`      | string/null | `"Customer"` or `"Executive"` — who sent the last message. Useful for visual indicators (e.g., bold if customer spoke last). |
| `chats[].tags`                     | string[]    | List of tags applied to this chat. Display as colored badges.                                                           |
| `chats[].assigned_executive_id`    | string/null | Executive currently assigned to this chat. `null` if unassigned.                                                        |
| `chats[].unseen_count`             | int         | Number of messages not yet seen by the `sender` executive. Use for unread badges. Only present when `sender` is provided in the request. |
| `pagination.page`                  | int         | Current page number.                                                                                                    |
| `pagination.page_size`             | int         | Items per page.                                                                                                         |
| `pagination.total`                 | int         | Total number of chats matching the filters.                                                                             |
| `pagination.total_pages`           | int         | Total number of pages.                                                                                                  |

---

#### `fetch_chats_by_user`

Fetch paginated message history for a specific chat. Also marks all messages as "seen" by the requesting executive.

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "sender": "agent_john",
  "page": 1,
  "page_size": 20
}
```

| Field       | Type   | Required | Default | Description                                                                                                        |
|-------------|--------|----------|---------|--------------------------------------------------------------------------------------------------------------------|
| `chat_id`   | string | Yes      | —       | MongoDB ObjectId of the chat to fetch messages for.                                                                |
| `sender`    | string | Yes      | —       | Executive's ID. Used to mark all fetched messages as "seen" by this executive, clearing the unread badge.          |
| `page`      | int    | No       | `1`     | Page number. Messages are sorted newest-first, so page 1 returns the most recent messages.                         |
| `page_size` | int    | No       | `20`    | Messages per page.                                                                                                 |

**Listen:** `fetch_chats_by_user_response`

```json
{
  "status": 1,
  "messages": [
    {
      "message_id": "65b2c3d4e5f6a7b8c9d0e1f2",
      "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "sender": "919876543210",
      "sender_type": "Customer",
      "channel": "whatsapp",
      "message": "I need help with my booking",
      "message_tag": null,
      "media_type": null,
      "media": null,
      "mediaUrl": null,
      "datetime": "2026-02-23T14:30:00",
      "seen_by": ["agent_john", "agent_jane"]
    },
    {
      "message_id": "65b2c3d4e5f6a7b8c9d0e1f3",
      "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "sender": "agent_john",
      "sender_type": "Executive",
      "channel": "whatsapp",
      "message": "Sure, let me check your booking details.",
      "message_tag": null,
      "media_type": null,
      "media": null,
      "mediaUrl": null,
      "datetime": "2026-02-23T14:31:00",
      "seen_by": ["agent_john"]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

| Field                      | Type        | Description                                                                                                       |
|----------------------------|-------------|-------------------------------------------------------------------------------------------------------------------|
| `messages[].message_id`    | string      | Unique message identifier.                                                                                        |
| `messages[].chat_id`       | string      | Parent chat ID. Always matches the requested `chat_id`.                                                           |
| `messages[].sender`        | string      | Who sent the message — either a phone number (customer) or an executive ID.                                       |
| `messages[].sender_type`   | string      | `"Customer"` or `"Executive"`. Use to style messages differently (left vs right alignment).                       |
| `messages[].channel`       | string      | `"whatsapp"` or `"inapp"`. Indicates the channel used. Potentially useful for displaying a channel icon.          |
| `messages[].message`       | string      | The message text content.                                                                                         |
| `messages[].message_tag`   | string/null | WhatsApp interactive button reply ID (e.g., `"yes_resolved"`). Present when the customer tapped a quick-reply button. |
| `messages[].media_type`    | string/null | `"image"`, `"video"`, `"audio"`, or `"document"`. `null` for text-only messages. Determines which media component to render. |
| `messages[].media`         | object/null | Raw media metadata object from WhatsApp. Contains fields like `id`, `mime_type`, `sha256`. Use for advanced media handling. |
| `messages[].mediaUrl`      | string/null | Direct URL to the media file. Use this to render images/videos in the chat bubble.                                |
| `messages[].datetime`      | string      | ISO 8601 timestamp when the message was sent/received. Use for message timestamps and date separators.            |
| `messages[].seen_by`       | string[]    | List of executive IDs who have viewed this message. Can be used to show read receipts.                            |

**Side Effect:** All messages in the response are marked as seen by `sender`. This means fetching messages automatically clears the unread count for this executive.

---

#### `new_chat`

Create a new chat for a customer, or return the existing active chat. The backend automatically assigns an online executive via round-robin.

**Emit:**

```json
{
  "sender": "919876543210",
  "customer_type": "Partner"
}
```

| Field           | Type   | Required | Description                                                                                                         |
|-----------------|--------|----------|---------------------------------------------------------------------------------------------------------------------|
| `sender`        | string | Yes      | Customer's phone number. If a chat already exists for this customer, it is returned instead of creating a new one.  |
| `customer_type` | string | Yes      | Customer segment. Determines which executive queue (round-robin pool) to assign from.                               |

**Listen:** `new_chat_response`

```json
{
  "status": 1,
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "is_new": true,
  "assigned_to": "agent_john"
}
```

| Field         | Type        | Description                                                                                     |
|---------------|-------------|-------------------------------------------------------------------------------------------------|
| `chat_id`     | string      | The chat's ID. Use this to join the room and send messages.                                     |
| `is_new`      | boolean     | `true` if a new chat was created, `false` if an existing active chat was returned.              |
| `assigned_to` | string/null | Executive ID assigned to handle this chat. `null` if no executives are online for this customer type. |

**Broadcast:** If assigned, a `chat_assigned` event is sent to the chat room (see [Server-Broadcast Events](#33-server-broadcast-events-listen-only)).

---

#### `join_chat`

Join a chat room to receive real-time messages for that conversation. Call this when an executive opens/selects a chat.

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "type": "Agent"
}
```

| Field     | Type   | Required | Default   | Description                                                                          |
|-----------|--------|----------|-----------|--------------------------------------------------------------------------------------|
| `chat_id` | string | Yes      | —         | Chat room to join. The executive will receive all `new_message` events for this chat.|
| `type`    | string | No       | `"Agent"` | Connection type identifier. Always `"Agent"` for executive clients.                  |

**Listen:** `join_chat_response`

```json
{
  "status": 1,
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1"
}
```

---

#### `join_chat_customer`

Join a chat room as a customer-type participant. Used by customer-facing interfaces (if any).

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "type": "Customer",
  "customer_type": "Partner"
}
```

| Field           | Type   | Required | Default      | Description                                                          |
|-----------------|--------|----------|--------------|----------------------------------------------------------------------|
| `chat_id`       | string | Yes      | —            | Chat room to join.                                                   |
| `type`          | string | No       | `"Customer"` | Connection type. Always `"Customer"` for customer-facing clients.    |
| `customer_type` | string | Yes      | —            | Customer segment. Tracked in the socket collection for analytics.    |

**Listen:** `join_chat_customer_response`

```json
{
  "status": 1,
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1"
}
```

---

#### `send_message`

Send a message in a chat. For executive messages, the backend automatically delivers the message to the customer via WhatsApp.

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "sender": "agent_john",
  "type": "Agent",
  "message": "Hi, I've checked your booking. It's confirmed for tomorrow at 10 AM.",
  "customer_type": "Partner"
}
```

| Field           | Type   | Required | Description                                                                                                                                      |
|-----------------|--------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `chat_id`       | string | Yes      | Target chat ID. The message is stored under this chat and broadcast to the chat room.                                                            |
| `sender`        | string | Yes      | Sender identifier — executive ID for agent messages, phone number for customer messages.                                                         |
| `type`          | string | Yes      | `"Agent"` or `"Customer"`. Determines the message flow: Agent messages trigger WhatsApp delivery to the customer; Customer messages are saved only. |
| `message`       | string | Yes      | Message text content. For agent messages, this exact text is sent to the customer's WhatsApp.                                                    |
| `customer_type` | string | Yes      | Customer segment. Determines which WhatsApp business number and API key to use for delivery (each segment has its own WhatsApp number).          |

**Listen:** `send_message_response`

```json
{
  "status": 1,
  "message_id": "65b2c3d4e5f6a7b8c9d0e1f2"
}
```

| Field        | Type   | Description                                                          |
|--------------|--------|----------------------------------------------------------------------|
| `message_id` | string | MongoDB ObjectId of the saved message. Can be used for tracking.    |

**Broadcast:** A `new_message` event is sent to all other participants in the chat room (see below).

---

#### `leave_chat`

Leave a chat room. Call this when the executive navigates away from the chat view.

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1"
}
```

| Field     | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `chat_id` | string | Yes      | Chat room to leave.           |

**Listen:** `leave_chat_response`

```json
{
  "status": 1
}
```

**Broadcast:** A `user_left` event is sent to remaining participants with `{ "connection_id": "<socket_id>" }`.

---

#### `update_chat_status`

Change a chat's status (active/resolved). Resolving a chat clears all tags, logs the resolution, and sends a WhatsApp resolution message to the customer.

**Emit:**

```json
{
  "customer_number": "919876543210",
  "update_by_number": "agent_john",
  "status": "resolved"
}
```

| Field              | Type   | Required | Description                                                                                                                |
|--------------------|--------|----------|----------------------------------------------------------------------------------------------------------------------------|
| `customer_number`  | string | Yes      | Customer phone number identifying the chat. The backend finds the active chat for this customer.                           |
| `update_by_number` | string | Yes      | Executive ID performing the status change. Logged in the resolve log for accountability.                                   |
| `status`           | string | Yes      | New status: `"active"` (re-open) or `"resolved"` (close). Resolving triggers cleanup actions like tag clearing and WhatsApp notification. |

**Listen:** `update_chat_status_response`

```json
{
  "status": 1,
  "old_status": "active",
  "new_status": "resolved"
}
```

| Field        | Type   | Description                                                                           |
|--------------|--------|---------------------------------------------------------------------------------------|
| `status`     | int    | `1` = success, `0` = chat not found.                                                 |
| `old_status` | string | Previous chat status before the update.                                               |
| `new_status` | string | New chat status after the update.                                                     |

**Side Effects on Resolution:**
1. All tags are cleared from the chat
2. A resolution log entry is created
3. A WhatsApp resolution message is sent to the customer
4. Dashboard counters are updated (active decremented, resolved incremented)
5. `dashboard_stats` event is broadcast to the dashboard room

---

#### `set_executive_status`

Set an executive's online/offline status via WebSocket (alternative to the REST endpoint). Going offline removes the executive from the round-robin queue and reassigns their chats.

**Emit:**

```json
{
  "executive_id": "agent_john",
  "status": "online",
  "customer_type": "Partner"
}
```

| Field           | Type   | Required | Description                                                                                     |
|-----------------|--------|----------|-------------------------------------------------------------------------------------------------|
| `executive_id`  | string | Yes      | The executive's identifier.                                                                     |
| `status`        | string | Yes      | `"online"` — join the round-robin queue; `"offline"` — leave the queue, reassign chats.         |
| `customer_type` | string | Yes      | Which customer-type queue to join/leave. An executive can only be in one queue at a time.       |

**Listen:** `set_executive_status_response`

```json
{
  "status": 1,
  "executive_id": "agent_john",
  "new_status": "online"
}
```

**Broadcast:** An `executive_status` event is sent to the `dashboard` room so other clients can update the online executives list.

---

#### `apply_tag`

Add or remove a tag on a chat. Tags help categorize and filter chats by issue type.

**Emit:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "tag": "Payment Issue",
  "action": "add"
}
```

| Field     | Type   | Required | Description                                                                                                   |
|-----------|--------|----------|---------------------------------------------------------------------------------------------------------------|
| `chat_id` | string | Yes      | Chat to modify.                                                                                               |
| `tag`     | string | Yes      | Tag label to add or remove. Must be one of the tags returned by `GET /api/chats/tags`.                        |
| `action`  | string | Yes      | `"add"` to apply the tag, `"remove"` to remove it.                                                            |

**Listen:** `apply_tag_response`

```json
{
  "status": 1
}
```

**Broadcast:** A `tag_updated` event is sent to the chat room:

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "tag": "Payment Issue",
  "action": "add"
}
```

**Special Behavior:** The tag `"Awaiting Customer Response"` is special — adding/removing it adjusts the `awaiting_customer_response` dashboard counter.

---

### 3.3 Server-Broadcast Events (Listen Only)

These events are emitted by the server and should be listened to by the client. You do not emit these.

---

#### `new_message`

A new message was sent in a chat room you've joined.

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "sender": "919876543210",
  "sender_type": "Customer",
  "message": "When will my cab arrive?",
  "datetime": "2026-02-23T14:35:00"
}
```

| Field         | Type   | Description                                                                                         |
|---------------|--------|-----------------------------------------------------------------------------------------------------|
| `chat_id`     | string | Which chat this message belongs to.                                                                 |
| `sender`      | string | Phone number (customer) or executive ID.                                                            |
| `sender_type` | string | `"Customer"` or `"Executive"`.                                                                      |
| `message`     | string | Message text.                                                                                       |
| `datetime`    | string | ISO 8601 timestamp.                                                                                 |

**When received:** Append the message to the open chat view. If the chat is not currently open, increment the unread badge.

---

#### `room_update` / `room_update_customer` / `room_update_vendor` / `room_update_srdp`

A chat in the list has been updated (new message, status change, etc.). Broadcast to the appropriate customer-type room.

| Event Name              | Broadcast To   | Customer Type |
|-------------------------|----------------|---------------|
| `room_update`           | `PartnerApp`   | Partner       |
| `room_update_customer`  | `CustomerApp`  | Customer      |
| `room_update_vendor`    | `VendorApp`    | Vendor        |
| `room_update_srdp`      | `SRDPApp`      | SRDP          |

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "customer": "919876543210",
  "customer_name": "Rahul Sharma",
  "last_message": "When will my cab arrive?",
  "last_message_time": "2026-02-23T14:35:00",
  "last_interaction_by": "Customer"
}
```

| Field               | Type        | Description                                                                 |
|---------------------|-------------|-----------------------------------------------------------------------------|
| `chat_id`           | string      | Chat that was updated.                                                      |
| `customer`          | string      | Customer phone number.                                                      |
| `customer_name`     | string/null | Customer display name.                                                      |
| `last_message`      | string      | Most recent message text (for the chat list preview).                       |
| `last_message_time` | string      | ISO 8601 timestamp (for sorting and "X min ago" display).                   |
| `last_interaction_by`| string     | Who sent the last message.                                                  |

**When received:** Update the chat list item in-place — refresh the preview text, timestamp, and re-sort the list so the most recently active chat appears at the top.

---

#### `dashboard_stats`

Updated aggregate dashboard statistics. Broadcast to the `dashboard` room whenever counters change.

**Payload:**

```json
{
  "active": 41,
  "resolved": 188,
  "awaiting_customer_response": 7
}
```

**When received:** Update the dashboard counter widgets in real time.

---

#### `sla_alert`

An SLA threshold has been breached. A customer has been waiting too long without a response.

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "customer_type": "Partner",
  "elapsed_minutes": 5,
  "alert_type": "3min"
}
```

| Field             | Type   | Description                                                                                           |
|-------------------|--------|-------------------------------------------------------------------------------------------------------|
| `chat_id`         | string | The chat that breached the SLA.                                                                       |
| `customer_type`   | string | Customer segment.                                                                                     |
| `elapsed_minutes` | int    | Minutes since the customer's last message without an executive response.                              |
| `alert_type`      | string | `"3min"` = initial alert (customer waiting >3 min); `"10min"` = escalation (customer waiting >10 min).|

**When received:** Display a visual/audio alert. Highlight the affected chat in the list. The `"10min"` alert is an escalation — consider showing it more prominently (e.g., red badge, sound notification).

---

#### `chat_assigned`

A chat has been assigned to an executive (via round-robin or manual assignment).

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "assigned_executive_id": "agent_john"
}
```

**When received:** Update the chat's assigned executive in the UI. If the current user is the assigned executive, consider auto-opening or highlighting the chat.

---

#### `chat_reassigned`

A chat has been reassigned from one executive to another (typically because the original executive went offline).

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "from_executive_id": "agent_john",
  "to_executive_id": "agent_jane"
}
```

| Field               | Type        | Description                                                           |
|---------------------|-------------|-----------------------------------------------------------------------|
| `from_executive_id` | string      | Executive who previously had this chat.                               |
| `to_executive_id`   | string/null | New executive. `null` if no online executive was available.           |

**When received:** Update the assignment indicator. If `to_executive_id` matches the current user, the chat is now their responsibility.

---

#### `executive_status`

An executive's online/offline status changed. Broadcast to the `dashboard` room.

**Payload:**

```json
{
  "executive_id": "agent_john",
  "status": "offline",
  "customer_type": "Partner"
}
```

**When received:** Update the online executives list/indicator in the dashboard.

---

#### `tag_updated`

A tag was added or removed from a chat. Broadcast to the chat room.

**Payload:**

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "tag": "Payment Issue",
  "action": "add"
}
```

**When received:** Update the tag badges on the chat in the list and in the chat detail view.

---

#### `user_left`

A participant left the chat room.

**Payload:**

```json
{
  "connection_id": "abc123xyz"
}
```

**When received:** Optional — can be used to update a "users viewing this chat" indicator.

---

## 4. Enums & Constants

### Customer Types

| Value        | Description                          | WhatsApp Room   | Room Update Event        |
|--------------|--------------------------------------|-----------------|--------------------------|
| `"Partner"`  | Business partners / DCO agents       | `PartnerApp`    | `room_update`            |
| `"Customer"` | End customers / riders               | `CustomerApp`   | `room_update_customer`   |
| `"Vendor"`   | Vendor partners                      | `VendorApp`     | `room_update_vendor`     |
| `"SRDP"`     | SRDP (Service & Ride Delivery Partner)| `SRDPApp`      | `room_update_srdp`       |

### Chat Statuses

| Value        | Description                                                |
|--------------|------------------------------------------------------------|
| `"active"`   | Chat is open and may need executive attention.             |
| `"resolved"` | Chat has been closed. No further action needed.            |

### Executive Statuses

| Value       | Description                                                     |
|-------------|-----------------------------------------------------------------|
| `"online"`  | Executive is active and accepting new chat assignments.         |
| `"offline"` | Executive is unavailable. Assigned chats are redistributed.     |

### Media Types

| Value        | Description                                      |
|--------------|--------------------------------------------------|
| `"image"`    | Photo attachment (JPEG, PNG, etc.)               |
| `"video"`    | Video attachment (MP4, etc.)                     |
| `"audio"`    | Voice note or audio file                         |
| `"document"` | PDF, spreadsheet, or other document              |
| `null`       | Text-only message, no media                      |

### Sender Types

| Value         | Description                                      |
|---------------|--------------------------------------------------|
| `"Customer"`  | Message sent by the customer (inbound)           |
| `"Executive"` | Message sent by a support executive (outbound)   |

### Channels

| Value        | Description                                                |
|--------------|------------------------------------------------------------|
| `"whatsapp"` | Message sent/received via WhatsApp                         |
| `"inapp"`    | Message sent via the in-app chat interface                 |

### Tag Actions

| Value      | Description               |
|------------|---------------------------|
| `"add"`    | Apply a tag to a chat     |
| `"remove"` | Remove a tag from a chat  |

---

## 5. Error Handling

### Standard Response Envelope

All responses (REST and WebSocket) follow this pattern:

```json
{
  "status": 1,
  "message": "Optional description",
  "data": {}
}
```

| `status` Value | Meaning                                       |
|----------------|-----------------------------------------------|
| `1`            | Success — operation completed as expected.    |
| `0`            | Error — check `message` for details.          |

### HTTP Status Codes (REST Only)

| Code | Meaning                                                    |
|------|------------------------------------------------------------|
| 200  | Success                                                    |
| 400  | Bad request — missing or invalid parameters                |
| 401  | Unauthorized — JWT missing, invalid, or expired            |
| 403  | Forbidden — insufficient permissions (e.g., admin token)   |
| 429  | Rate limit exceeded — wait and retry                       |
| 502  | External service unavailable (auth API, WhatsApp API)      |
| 503  | Service unavailable — backend dependencies are down        |

### Rate Limits

| Endpoint Category     | Limit           |
|-----------------------|-----------------|
| Login                 | 10/minute       |
| Cache clear           | 5/minute        |
| Standard endpoints    | 100/minute      |
| Webhooks              | 200/minute      |

### WebSocket Error Handling

- **Connection rejected:** Listen for `connect_error` — typically means the JWT is invalid/expired. Redirect to login.
- **Event errors:** Every event response includes `status: 0` with a `message` field describing the error.
- **Disconnection:** Socket.IO handles reconnection automatically. Re-emit `join_chat` / `set_executive_status` after reconnection to restore state.

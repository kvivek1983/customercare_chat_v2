# Backend Request: Add `join_room` Socket Event Handler

## Context — Why This Is Needed

The frontend chat list page needs **real-time updates** when any customer sends a new message. The backend already broadcasts `room_update_customer` / `room_update_vendor` / `room_update_srdp` events to their respective rooms (`CustomerApp`, `VendorApp`, `SRDPApp`).

**The problem:** There is no `join_room` socket event handler on the backend. When the frontend emits `join_room { room: "CustomerApp" }`, the backend silently ignores it. The socket never actually joins the `CustomerApp` room, so it never receives any `room_update_*` broadcasts.

Currently the frontend uses a **30-second polling fallback** to keep the chat list fresh, which is inefficient and not real-time.

---

## What The Backend Currently Does

| Step | What Happens |
|------|-------------|
| 1. Frontend connects via Socket.IO with JWT | Socket connected, authenticated |
| 2. Frontend emits `join_room { room: "CustomerApp" }` | **Silently ignored — no handler exists** |
| 3. Customer sends a WhatsApp message | Backend saves message, broadcasts `room_update_customer` to `CustomerApp` room |
| 4. Frontend socket is NOT in `CustomerApp` room | **Broadcast is lost — nobody receives it** |
| 5. Chat list stays stale | Frontend falls back to polling every 30 seconds |

Per `BACKEND_REQUESTS_IMPLEMENTATION.md` item #12:
> `join_room` | N/A — handled by `join_chat` / `join_chat_customer`

But `join_chat` / `join_chat_customer` only join **individual chat rooms** (e.g., `chat_65a1b2c3...`), NOT the customer-type dashboard rooms (`CustomerApp`, `VendorApp`, etc.).

---

## What The Backend Needs To Do

### Add a `join_room` event handler

When the frontend emits:
```json
{ "event": "join_room", "data": { "room": "CustomerApp" } }
```

The backend should:
1. Validate that `room` is one of: `PartnerApp`, `CustomerApp`, `VendorApp`, `SRDPApp`
2. Add the socket to that Socket.IO room using `sio.enter_room(sid, room)`
3. Respond with `join_room_response { status: 1, room: "CustomerApp" }`

### Pseudocode (Python Socket.IO)

```python
# In events.py — register new handler

VALID_ROOMS = {'PartnerApp', 'CustomerApp', 'VendorApp', 'SRDPApp'}

@sio.event
async def join_room(sid, data):
    room = data.get('room', '')

    if room not in VALID_ROOMS:
        await sio.emit('join_room_response', {
            'status': 0,
            'message': f'Invalid room: {room}'
        }, to=sid)
        return

    # Add socket to the room
    sio.enter_room(sid, room)

    await sio.emit('join_room_response', {
        'status': 1,
        'room': room
    }, to=sid)
```

### Register in websocket_router.py

Add `join_room` to the list of registered event handlers (alongside `join_chat`, `send_message`, etc.)

---

## Room Architecture Diagram

```
Socket.IO Rooms
├── Chat Rooms (per-conversation)         ← joined via join_chat
│   ├── chat_65a1b2c3...                    → receives: new_message, tag_updated
│   ├── chat_78d4e5f6...                    → receives: new_message, tag_updated
│   └── ...
│
├── Customer-Type Rooms (dashboard)       ← joined via join_room (NEEDS HANDLER)
│   ├── PartnerApp                          → receives: room_update
│   ├── CustomerApp                         → receives: room_update_customer
│   ├── VendorApp                           → receives: room_update_vendor
│   └── SRDPApp                             → receives: room_update_srdp
│
└── Dashboard Room
    └── dashboard                           → receives: dashboard_stats
```

**`join_chat`** = joins a specific chat room (already works)
**`join_room`** = joins a customer-type dashboard room (**needs handler**)

---

## Expected Flow After Fix

| Step | What Happens |
|------|-------------|
| 1. Frontend connects via Socket.IO with JWT | Socket connected |
| 2. Frontend emits `join_room { room: "CustomerApp" }` | **Backend adds socket to `CustomerApp` room** |
| 3. Backend responds `join_room_response { status: 1, room: "CustomerApp" }` | Frontend confirms room joined |
| 4. Customer sends a WhatsApp message | Backend broadcasts `room_update_customer` to `CustomerApp` room |
| 5. Frontend socket IS in `CustomerApp` room | **Broadcast received instantly** |
| 6. Chat list updates in real-time | Chat moves to top with unread badge |

---

## Frontend Event Reference

The frontend already emits this event (no frontend changes needed):

```typescript
// chat.service.ts line 158-160
joinRoom(room: string): void {
    this.socket?.emit('join_room', { room });
}
```

Called from `chat-number-list.component.ts` on page load:
```typescript
// Emits join_room with: CustomerApp, VendorApp, SRDPApp, or PartnerApp
private joinCustomerTypeRoom(): void {
    const roomMap = {
        'Customer': 'CustomerApp',
        'Partner':  'PartnerApp',
        'Vendor':   'VendorApp',
        'SRDP':     'SRDPApp',
    };
    const room = roomMap[this.customerType] || 'PartnerApp';
    this.chatService.joinRoom(room);
}
```

---

## Testing

1. Deploy the backend change
2. Open browser console on the frontend chat list page
3. You should see: `Joining socket room: CustomerApp for customerType: Customer`
4. Send a WhatsApp message from a test customer number
5. The chat list should update **immediately** (not after 30 seconds)
6. Console should show: `New onRoomUpdate received: { chat_id: "...", ... }`

Once confirmed working, the frontend polling fallback (30-second refresh) can be removed.

---

## Summary

| What | Details |
|------|---------|
| **Event name** | `join_room` |
| **Payload** | `{ room: "CustomerApp" }` (or `VendorApp`, `SRDPApp`, `PartnerApp`) |
| **Backend action** | `sio.enter_room(sid, room)` |
| **Response** | `join_room_response { status: 1, room: "CustomerApp" }` |
| **Files to modify** | `events.py`, `websocket_router.py` |
| **Estimated effort** | ~15 minutes |
| **Impact** | Enables real-time chat list updates, eliminates 30s polling |

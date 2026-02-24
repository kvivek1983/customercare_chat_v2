# Backend Request: Broadcast `room_update` to `PartnerApp` Room

## Context — What's Broken

The `join_room` handler was implemented (✅ thank you!) and the frontend successfully joins the `PartnerApp` room:

```
[Socket] join_room_response: {"status":1,"room":"PartnerApp"}
```

**However**, when a Partner/DCO chat receives a new WhatsApp message, the backend is **not broadcasting `room_update` to the `PartnerApp` room**. The frontend socket is in the room, but never receives any event.

Real-time chat list updates work on the **Customer page** (via `room_update_customer` → `CustomerApp`), but **NOT on the Partner/DCO page**.

---

## What's Currently Happening

| Event | Room | Status |
|-------|------|--------|
| `room_update_customer` → `CustomerApp` | Customer chat gets new message | ✅ **Working** |
| `room_update_vendor` → `VendorApp` | Vendor chat gets new message | ⚠️ Untested |
| `room_update_srdp` → `SRDPApp` | SRDP chat gets new message | ⚠️ Untested |
| `room_update` → `PartnerApp` | Partner chat gets new message | ❌ **NOT Broadcasting** |

### Evidence from Browser Console

```
[Socket] emitting join_room: PartnerApp
[Socket] join_room_response: {"status":1,"room":"PartnerApp"}    ← room joined OK

# ... waited for new Partner WhatsApp messages ...
# NO room_update events received at all
# Chat list stayed stale, only updated via 30-second polling fallback
```

Meanwhile on the Customer page:
```
[Socket] emitting join_room: CustomerApp
[Socket] join_room_response: {"status":1,"room":"CustomerApp"}
[Socket] room_update_customer received: 67bc... Customer          ← works instantly!
```

---

## What The Backend Needs To Do

When a Partner/DCO chat receives a new WhatsApp message, the backend should broadcast:

```python
await sio.emit('room_update', chat_summary_data, room='PartnerApp')
```

This should happen in the same code path where `room_update_customer` is broadcast to `CustomerApp`.

### Where to Look

Search the backend code for where `room_update_customer` is emitted. There should be a conditional that determines which event/room to use based on `customer_type`. Partner chats likely fall through without broadcasting.

**Likely pattern:**
```python
# Current code (probably):
if customer_type == 'Customer':
    await sio.emit('room_update_customer', data, room='CustomerApp')
elif customer_type == 'Vendor':
    await sio.emit('room_update_vendor', data, room='VendorApp')
elif customer_type == 'SRDP':
    await sio.emit('room_update_srdp', data, room='SRDPApp')
# ← Partner is MISSING here!
```

**Fix — add Partner broadcast:**
```python
elif customer_type == 'Partner':
    await sio.emit('room_update', data, room='PartnerApp')
```

> **Note:** The frontend listens for `room_update` (no suffix) for Partner chats. This is the event name the V1 system used. If you prefer to use `room_update_partner` instead, let me know and I'll update the frontend to match.

---

## Frontend Listener Reference

The frontend already listens for all four event names (no changes needed):

```typescript
// chat.service.ts — onRoomUpdate()
this.socket.on('room_update',          handler('room_update'));           // ← Partner
this.socket.on('room_update_customer', handler('room_update_customer')); // ← Customer
this.socket.on('room_update_vendor',   handler('room_update_vendor'));   // ← Vendor
this.socket.on('room_update_srdp',     handler('room_update_srdp'));     // ← SRDP
```

---

## Expected Payload

The `room_update` event should contain the same chat summary object that `room_update_customer` sends:

```json
{
  "chat_id": "67bc1234abcd...",
  "customer_name": "Vivek",
  "customer_type": "Partner",
  "last_message": "Hello, I need help with...",
  "last_message_time": "2026-02-24T10:30:00Z",
  "unread_count": 1,
  "status": "active"
}
```

(Fields may vary — just use the same format as `room_update_customer`.)

---

## Testing

1. Deploy the backend fix
2. Open `https://customercarechatv2-production.up.railway.app/#/base/dcoChat`
3. Open browser console (F12)
4. Verify: `[Socket] join_room_response: {"status":1,"room":"PartnerApp"}`
5. Send a WhatsApp message from a Partner/DCO number
6. Console should show: `[Socket] room_update received: <chat_id> Partner`
7. Chat list should update **immediately** (not after 30 seconds)

---

## Summary

| What | Details |
|------|---------|
| **Problem** | Backend not broadcasting `room_update` to `PartnerApp` room |
| **Cause** | Partner case missing from the broadcast conditional |
| **Fix** | Add `sio.emit('room_update', data, room='PartnerApp')` for Partner chats |
| **Event name** | `room_update` (no suffix, matching V1 convention) |
| **Target room** | `PartnerApp` |
| **Estimated effort** | ~5 minutes |
| **Impact** | Enables real-time chat list on Partner/DCO page |

# Backend Request: Enrich `sla_alert` Payload with Executive & Customer Info

## Context — What's Broken

The `sla_alert` WebSocket event currently only sends:

```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "customer_type": "Partner",
  "elapsed_minutes": 5,
  "alert_type": "3min"
}
```

**Two problems:**

1. **No executive filtering** — All connected executives see ALL SLA alerts, even for chats not assigned to them. This floods the screen with irrelevant alerts.
2. **Raw chat_id shown** — The toast says "SLA breach on chat 69a41545e6001f8ed448703d" which is meaningless. Executives need to see the customer name/number to know which chat to act on.

---

## What's Currently Happening

| Issue | Impact |
|-------|--------|
| No `assigned_executive_id` in payload | Frontend can't filter — all executives see all alerts |
| No `customer_name` / `customer` in payload | Toast shows raw MongoDB ObjectId instead of customer info |
| Every SLA breach fires for all clients | 6+ orange toasts stacking up on screen, UI unusable |

### Screenshot Evidence

Multiple orange "SLA Alert" toasts stacked on the right side of the Partner chat page, each showing a raw chat_id like `69a41545e6001f8ed448703d`.

---

## What The Backend Needs To Do

Add 3 fields to the `sla_alert` payload. These fields already exist on the chat document in MongoDB — just include them when building the alert.

### Current Payload
```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "customer_type": "Partner",
  "elapsed_minutes": 5,
  "alert_type": "3min"
}
```

### Required Payload
```json
{
  "chat_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "customer_type": "Partner",
  "elapsed_minutes": 5,
  "alert_type": "3min",
  "assigned_executive_id": "agent_john",
  "customer_name": "Rajesh Kumar",
  "customer": "9876543210"
}
```

### New Fields

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `assigned_executive_id` | string/null | `chat.assigned_executive_id` | Frontend filters alerts — only show to the assigned executive |
| `customer_name` | string/null | `chat.customer_name` | Display in toast (e.g., "SLA breach: Rajesh Kumar (5 min)") |
| `customer` | string | `chat.customer` | Fallback display — phone number if name is not available |

### Where to Look

Search for where `sla_alert` is emitted in the SLA check background task. It likely iterates over active chats and emits alerts for breached ones. When building the alert payload dict, just add the 3 extra fields from the chat document.

**Likely pattern:**
```python
# Current code (probably):
alert_data = {
    "chat_id": str(chat["_id"]),
    "customer_type": chat.get("customer_type", ""),
    "elapsed_minutes": elapsed,
    "alert_type": alert_type
}

# Fix — add 3 fields:
alert_data = {
    "chat_id": str(chat["_id"]),
    "customer_type": chat.get("customer_type", ""),
    "elapsed_minutes": elapsed,
    "alert_type": alert_type,
    "assigned_executive_id": chat.get("assigned_executive_id"),     # NEW
    "customer_name": chat.get("customer_name"),                      # NEW
    "customer": chat.get("customer", ""),                            # NEW
}
```

---

## Frontend Already Updated

The frontend code has been updated to use these fields:

```typescript
// conversations.component.ts — SLA alert subscription
this.chatService.onSlaAlert()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe((alert: any) => {
    if (alert.customer_type !== this.config.customerType) return;
    if (alert.assigned_executive_id && alert.assigned_executive_id !== this.getExecutiveId()) return;
    const displayName = alert.customer_name || alert.customer || alert.chat_id;
    this.toastr.warning(
      `SLA breach: ${displayName} (${alert.elapsed_minutes} min)`,
      'SLA Alert',
      { timeOut: 10000 }
    );
  });
```

**Backward compatible:** If backend hasn't deployed yet, the frontend gracefully falls back — executive filter is skipped (shows all for the stakeholder), and display falls back to `chat_id`.

---

## Testing

1. Deploy the backend fix
2. Open `https://customercarechatv2-production.up.railway.app/#/base/dcoChat`
3. Log in as `agent_john`
4. Wait for an SLA breach on a Partner chat assigned to `agent_john`
5. Verify: Toast shows "SLA breach: Rajesh Kumar (5 min)" (not raw chat_id)
6. Verify: SLA alerts for chats assigned to OTHER executives do NOT appear
7. Verify: SLA alerts for Customer/Vendor/SRDP chats do NOT appear on Partner page

---

## Summary

| What | Details |
|------|---------|
| **Problem** | SLA alerts flood all executives with raw chat_ids |
| **Cause** | Payload missing `assigned_executive_id`, `customer_name`, `customer` |
| **Fix** | Add 3 fields from chat document to the `sla_alert` payload |
| **Estimated effort** | ~10 minutes |
| **Impact** | Executives only see relevant alerts with readable customer info |

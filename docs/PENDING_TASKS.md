# Smart Chat API v2 â€” Pending Tasks & Integrations
**Project:** OneWay.Cab â€” Smart Chat API v2  
**Last Updated:** 19 Feb 2026  
**Purpose:** Track everything that needs to happen outside of code before go-live.

---

## STATUS LEGEND

| Symbol | Meaning |
|---|---|
| â¬œ | Not started |
| ðŸ”„ | In progress |
| âœ… | Done |
| âŒ | Blocked |
| â“ | Needs decision |

---

## 1. BUSINESS DECISIONS (Blocks everything downstream)

### 1.1 Context Field Definitions
**Owner:** Business / Product  
**Blocks:** Context YAML files, `v2_context_config` seed data, context_change webhook

| Stakeholder | Status | Fields Decided | Notes |
|---|---|---|---|
| Partner / DCO | ðŸ”„ | `documents_status`, `dco_status` | Confirmed from v1 audit â€” pending final sign-off |
| Customer | â“ | TBD | What defines a new context for a customer? |
| Vendor | â“ | TBD | What defines a new context for a vendor? |
| SRDP | â“ | TBD | What defines a new context for SRDP? |

**Decision needed:**
> For each stakeholder â€” which fields, when changed, should create a new `chat_id`?
> The transaction/ops system will only send fields that actually changed.

---

### 1.2 Predefined Tags Per Stakeholder
**Owner:** Business / Ops  
**Blocks:** `v2_chat_tags` seed data, tagging feature go-live

| Stakeholder | Status | Tags |
|---|---|---|
| Partner / DCO | â“ | TBD |
| Customer | â“ | TBD |
| Vendor | â“ | TBD |
| SRDP | â“ | TBD |

**Note:** "Awaiting Customer Response" is system-generated â€” does not need to be in this list.

---

### 1.3 SLA Alert Recipients
**Owner:** Ops / Management  
**Blocks:** SLA monitoring go-live

| Item | Status | Value |
|---|---|---|
| OWC Internal Alert Group WA number | â“ | TBD |
| Shift Lead WA number (10-min escalation) | â“ | TBD |
| SLA alert WA message template text | â“ | TBD |
| Template registered with Pinbot? | â¬œ | â€” |

---

### 1.4 Login / Auth Strategy
**Owner:** OWC Dev + Business  
**Blocks:** Dashboard frontend login, executive JWT token generation

**Decision needed:**
> How do executives get a JWT token to connect to the v2 dashboard?

Options:
- A. Add `POST /api/auth/login` endpoint to v2 (email + password)
- B. JWT issued by a separate existing auth service â€” v2 just validates it
- C. Other existing SSO / login system

| Item | Status | Notes |
|---|---|---|
| Auth strategy decided | â“ | TBD |
| Login endpoint added to v2 | â¬œ | Pending decision above |
| Executive accounts seeded in `v2_executives` | â¬œ | Needs executive list |

---

## 2. PINBOT CONFIGURATION (External â€” Pinbot Dashboard)

### 2.1 Test WhatsApp Number
**Owner:** OWC (Pinbot account)  
**Blocks:** Any real end-to-end testing

| Item | Status | Notes |
|---|---|---|
| New test WA number requested from Pinbot | â¬œ | â€” |
| Test number webhook pointed to v2 staging | â¬œ | URL: `https://{staging-domain}/api/chats/whatsapp_chat/{test-number}` |
| Test number verified working | â¬œ | â€” |

---

### 2.2 Production Webhook URLs (Per Stakeholder)
**Owner:** OWC (Pinbot account)  
**Note:** Change ONE at a time. Partner first. Discount number NEVER changes.

| WA Number | Stakeholder | Current (v1) | New (v2) | Status |
|---|---|---|---|---|
| 919099039188 | Partner / DCO | v1 endpoint | `https://{domain}/api/chats/whatsapp_chat/9099039188` | â¬œ |
| 919638106888 | Customer | v1 endpoint | `https://{domain}/api/chats/whatsapp_chat/8000247247` | â¬œ |
| 919726724247 | Vendor | v1 endpoint | `https://{domain}/api/chats/whatsapp_chat/9726724247` | â¬œ |
| 919586924247 | SRDP | v1 endpoint | `https://{domain}/api/chats/whatsapp_chat/9586924247` | â¬œ |
| 919638120888 | Discount | v1 endpoint | **KEEP ON v1 â€” DO NOT CHANGE** | ðŸ”’ |

---

### 2.3 WhatsApp Message Templates
**Owner:** OWC (Pinbot account)  
**Blocks:** Resolution auto-message, SLA alerts

| Template | Type | Status | Notes |
|---|---|---|---|
| Resolution auto-message | Utility | â¬œ | "Hope we resolved your query. Rate 1-5." |
| SLA 3-min alert | Utility | â¬œ | For internal alert group |
| `ask_issue_resolved` (Hindi) | Utility | âœ… | Already registered in v1 â€” confirm available in v2 |

---

### 2.4 Pinbot API Keys
**Owner:** Pinbot account  
**Blocks:** `.env` setup, all outbound WA messages

| Item | Status | Notes |
|---|---|---|
| `WA_API_KEY_1` obtained | â¬œ | Primary key â€” most channels |
| `WA_API_KEY_2` obtained | â¬œ | Secondary key â€” vendor + customer_new channels |
| Keys added to `.env` on server | â¬œ | â€” |

---

## 3. TRANSACTION SYSTEM INTEGRATION (Internal â€” OWC Dev)

### 3.1 Booking Webhook
**Owner:** OWC Transaction System Dev  
**Blocks:** `v2_customer_rides` population, service window upcoming-rides feature

**Agreed payload format:**
```json
{
  "event": "created | modified | cancelled",
  "customer_number": "9638120888",
  "booking_id": "BK123456",
  "ride_datetime": "2026-02-20T14:30:00Z",
  "ride_status": "upcoming | ongoing | completed | cancelled"
}
```

**Endpoint:** `POST https://{domain}/api/webhook/booking`  
**Auth:** None (internal network) â€” confirm with infra team

| Item | Status | Notes |
|---|---|---|
| Payload format agreed | â¬œ | â€” |
| Transaction system sends on booking created | â¬œ | â€” |
| Transaction system sends on booking modified | â¬œ | â€” |
| Transaction system sends on booking cancelled | â¬œ | â€” |
| End-to-end tested | â¬œ | â€” |

---

### 3.2 Context Change Webhook
**Owner:** OWC Transaction / Ops System Dev  
**Blocks:** Context-based chat lifecycle feature

**Agreed payload format:**
```json
{
  "customer": "9638120888",
  "customer_type": "Partner",
  "context": {
    "documents_status": "Approved"
  }
}
```

**Note:** Payload only includes fields that actually changed â€” not the full context snapshot.  
**Endpoint:** `POST https://{domain}/api/webhook/context_change`

| Item | Status | Notes |
|---|---|---|
| Which system detects context changes? | â“ | TBD |
| Payload format agreed | â¬œ | â€” |
| Triggers identified per stakeholder | â¬œ | Depends on 1.1 above |
| End-to-end tested | â¬œ | â€” |

---

## 4. CODE â€” PENDING ITEMS

### 4.1 Login Endpoint
**Owner:** OWC Dev  
**Blocks:** Dashboard frontend authentication

| Item | Status | Notes |
|---|---|---|
| Auth strategy decided (see 1.4) | â“ | â€” |
| `POST /api/auth/login` endpoint built | â¬œ | Claude Code prompt ready to create |
| Integrated with executive accounts | â¬œ | â€” |

---

### 4.2 Context YAML Files
**Owner:** OWC Dev (after business decides fields â€” see 1.1)  
**Blocks:** Context feature go-live

| File | Status | Notes |
|---|---|---|
| `config/context/partner.yaml` | ðŸ”„ | Fields partially known â€” pending sign-off |
| `config/context/customer.yaml` | â¬œ | Fields TBD |
| `config/context/vendor.yaml` | â¬œ | Fields TBD |
| `config/context/srdp.yaml` | â¬œ | Fields TBD |
| Startup auto-seeder built | â¬œ | Claude Code prompt ready to create |

---

### 4.3 System Audit Findings
**Owner:** OWC Dev  
**Blocks:** Go-live confidence

| Item | Status | Notes |
|---|---|---|
| System audit run (V2_SYSTEM_AUDIT_PROMPT.md) | â¬œ | Run after all phases complete |
| Critical findings fixed | â¬œ | â€” |
| Bugs fixed | â¬œ | â€” |
| Warnings reviewed | â¬œ | â€” |

---

## 5. SEED DATA (One-Time MongoDB Setup)

### 5.1 `v2_chat_tags` Collection
**Blocks:** Tagging feature  
**Depends on:** 1.2 (tag list decision)

| Stakeholder | Status | Notes |
|---|---|---|
| Partner tags seeded | â¬œ | Pending tag list from business |
| Customer tags seeded | â¬œ | Pending tag list from business |
| Vendor tags seeded | â¬œ | Pending tag list from business |
| SRDP tags seeded | â¬œ | Pending tag list from business |

---

### 5.2 `v2_context_config` Collection
**Blocks:** Context feature  
**Depends on:** 1.1 (context field decision) + 4.2 (YAML files)

| Stakeholder | Status | Notes |
|---|---|---|
| Partner config seeded | â¬œ | â€” |
| Customer config seeded | â¬œ | â€” |
| Vendor config seeded | â¬œ | â€” |
| SRDP config seeded | â¬œ | â€” |

---

### 5.3 `v2_executives` Collection
**Blocks:** Round Robin assignment, Online/Offline feature  
**Depends on:** 1.4 (auth strategy)

| Item | Status | Notes |
|---|---|---|
| Executive list per stakeholder obtained | â¬œ | Who are the executives? Names + IDs |
| Partner executives seeded | â¬œ | â€” |
| Customer executives seeded | â¬œ | â€” |
| Vendor executives seeded | â¬œ | â€” |
| SRDP executives seeded | â¬œ | â€” |

---

## 6. ENVIRONMENT VARIABLES (Server `.env`)

| Variable | Owner | Status | Notes |
|---|---|---|---|
| `JWT_SECRET_KEY` | OWC Infra | â¬œ | Generate strong random string |
| `SECRET_KEY` | OWC Infra | â¬œ | Generate strong random string |
| `ADMIN_TOKEN` | OWC Infra | â¬œ | For cache management endpoint |
| `WEBHOOK_VERIFY_TOKEN` | OWC Dev | â¬œ | Must match Pinbot config |
| `WA_API_KEY_1` | Pinbot | â¬œ | From Pinbot dashboard |
| `WA_API_KEY_2` | Pinbot | â¬œ | From Pinbot dashboard |
| `SLA_ALERT_GROUP_NUMBER` | Ops | â¬œ | OWC internal alert group number |
| `SLA_SHIFT_LEAD_NUMBER` | Ops | â¬œ | Shift lead WA number |
| `MONGO_USER` | OWC Infra | â¬œ | DB credentials |
| `MONGO_PASSWORD` | OWC Infra | â¬œ | DB credentials |
| `REDIS_HOST` / `REDIS_PORT` | OWC Infra | â¬œ | Redis server details |
| `ALLOWED_ORIGINS` | OWC Dev | â¬œ | Dashboard domain(s) |

---

## 7. FRONTEND DASHBOARD (Frontend Team)

| Item | Status | Notes |
|---|---|---|
| WebSocket URL updated to v2 (`/ws?token=JWT`) | â¬œ | â€” |
| JWT login flow integrated | â¬œ | Depends on 1.4 auth decision |
| New events handled: `sla_alert` | â¬œ | 3-min countdown timer |
| New events handled: `chat_assigned` | â¬œ | Show assignment in UI |
| New events handled: `chat_reassigned` | â¬œ | Update assignment in UI |
| New events handled: `tag_updated` | â¬œ | Refresh tag display |
| New events handled: `executive_status` | â¬œ | Online/Offline indicator |
| Online/Offline toggle button added | â¬œ | Default OFFLINE on login |
| SLA countdown timer per chat | â¬œ | Uses `last_incoming_message` field |
| Tag apply/remove UI | â¬œ | â€” |
| Chat rating UI (post-resolution) | â¬œ | 1-5 star |
| Context history view (all chat_ids per customer) | â¬œ | â€” |

---

## 8. INFRASTRUCTURE (OWC Infra)

| Item | Status | Notes |
|---|---|---|
| v2 deployed to staging (port 5001) | â¬œ | Alongside v1 |
| v2 deployed to production (port 5001) | â¬œ | Alongside v1 â€” v1 stays running |
| Health check configured: `/api/health` | â¬œ | Kubernetes liveness probe |
| Readiness check configured: `/api/health/ready` | â¬œ | Kubernetes readiness probe |
| Domain / load balancer routing configured | â¬œ | â€” |
| v1 system kept running post-cutover | â¬œ | Discount campaign stays on v1 |

---

## 9. CUTOVER SEQUENCE

| Step | Status | Notes |
|---|---|---|
| 1. All items in sections 1-8 resolved | â¬œ | â€” |
| 2. System audit passed (section 4.3) | â¬œ | â€” |
| 3. E2E tests passed on test WA number | â¬œ | â€” |
| 4. Seed data confirmed in MongoDB | â¬œ | â€” |
| 5. Partner webhook â†’ v2 | â¬œ | Monitor 24 hours |
| 6. Customer webhook â†’ v2 | â¬œ | After Partner stable |
| 7. Vendor webhook â†’ v2 | â¬œ | After Customer stable |
| 8. SRDP webhook â†’ v2 | â¬œ | After Vendor stable |
| 9. Discount webhook â†’ stays on v1 | ðŸ”’ | Never change |
| 10. Full monitoring for 48 hours | â¬œ | â€” |

---

## BLOCKING DEPENDENCY MAP

```
Business Decisions (1.1, 1.2, 1.3, 1.4)
    â”‚
    â”œâ”€â”€ 1.1 Context Fields â”€â”€â†’ YAML Files (4.2) â”€â”€â†’ v2_context_config seed (5.2)
    â”‚                                           â”€â”€â†’ context_change webhook (3.2)
    â”‚
    â”œâ”€â”€ 1.2 Tag List â”€â”€â†’ v2_chat_tags seed (5.1)
    â”‚
    â”œâ”€â”€ 1.3 SLA Numbers â”€â”€â†’ .env values (6) â”€â”€â†’ SLA alerts working
    â”‚
    â””â”€â”€ 1.4 Auth Strategy â”€â”€â†’ Login endpoint (4.1) â”€â”€â†’ Frontend login (7)
                          â”€â”€â†’ v2_executives seed (5.3) â”€â”€â†’ Round Robin working

Pinbot (2)
    â”œâ”€â”€ Test number (2.1) â”€â”€â†’ E2E testing possible
    â”œâ”€â”€ API keys (2.4) â”€â”€â†’ .env (6) â”€â”€â†’ Outbound WA working
    â””â”€â”€ Webhook URLs (2.2) â”€â”€â†’ Cutover (9)

Transaction System (3)
    â”œâ”€â”€ Booking webhook (3.1) â”€â”€â†’ Ride data â”€â”€â†’ Service window feature
    â””â”€â”€ Context webhook (3.2) â”€â”€â†’ Context lifecycle feature

Code (4) â”€â”€â†’ Audit (4.3) â”€â”€â†’ Cutover (9)
```

---

## OPEN QUESTIONS LOG

| # | Question | Raised | Owner | Status |
|---|---|---|---|---|
| 1 | What fields define context for Customer stakeholder? | 19 Feb | Business | â“ Open |
| 2 | What fields define context for Vendor stakeholder? | 19 Feb | Business | â“ Open |
| 3 | What fields define context for SRDP stakeholder? | 19 Feb | Business | â“ Open |
| 4 | Which system detects and fires context_change webhook? | 19 Feb | OWC Dev | â“ Open |
| 5 | Auth strategy for executive login â€” option A, B, or C? | 19 Feb | OWC Dev + Business | â“ Open |
| 6 | What is the OWC Internal Alert Group WA number? | 19 Feb | Ops | â“ Open |
| 7 | Who is the Shift Lead per shift for 10-min escalation? | 19 Feb | Ops | â“ Open |
| 8 | Is `dco_status` confirmed as a context field for Partner? | 19 Feb | Business | â“ Open |

---

*Update this file as tasks are completed or decisions are made.*  
*Last updated: 19 Feb 2026*

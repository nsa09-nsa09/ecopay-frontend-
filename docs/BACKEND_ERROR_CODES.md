# Backend error codes — frontend handover

This document is the contract between the backend (`ecopay-backend`) and the
frontend localization layer (`src/app/lib/server-messages.ts`). Its goal: every
error a real user can trigger should arrive with a **stable, machine-readable
`ErrorResponse.code`**, so the frontend can show localized ru/kz/en copy without
matching fragile English strings.

## How the frontend consumes errors today

1. `requestJson` (lib/api.ts) parses `ErrorResponse.message` and `.errors`, then
   throws `ApiError(status, rawMessage, errors)`.
2. `buildFriendlyApiMessage` turns that into a **sanitized, localized** `.message`:
   - It first calls `resolveServerMessage(status, code, rawMessage, language)`.
   - Falls back to the English backstop defenses (never echo English into RU/KZ,
     never echo server internals/stack traces), then to a generic per-status
     message.
3. `resolveServerMessage` resolves via **two maps**:
   - **by `code`** (preferred, stable) — `BY_CODE`.
   - **by exact English message** (fallback) — `BY_MESSAGE`, matched on the
     trimmed string, case-insensitively, never fuzzy.

Each mapping is classified:

| Class | Meaning | Shown to user? |
| --- | --- | --- |
| `USER_ACTIONABLE` | The user can understand & fix it | Yes — specific copy |
| `SUPPORT` | Not the user's fault | Yes — reassuring copy + "contact support" |
| `INTERNAL` | Infra / crypto / provider detail | **Never** — generic fallback used |

## ⚠️ Open plumbing gap (frontend)

`ErrorResponse.code` is **not yet passed into `buildFriendlyApiMessage`** — the
`ApiError` constructor and `requestJson` (owned by another agent) do not capture
`payload.code`. Until they do, only the **exact-English-message path** is live.
As a stop-gap, the English messages for already-coded conflicts are duplicated
onto the message path. Once `requestJson` captures `payload.code` and threads it
through `ApiError` → `buildFriendlyApiMessage`, the `BY_CODE` path activates
automatically and the English duplicates can be dropped.

**Backend action:** none required for this gap — it is a frontend follow-up.
**Backend action (this doc):** populate `ErrorResponse.code` for the rows below.

## Codes already emitted (keep stable)

| HTTP | code | English message | Class |
| --- | --- | --- | --- |
| 403 | `ACCOUNT_BANNED` | (varies; uses `reason`/`banUntil`) | SUPPORT |
| 409 | `ROOM_FULL` | `Room is full` | USER_ACTIONABLE |
| 409 | `IDEMPOTENCY_KEY_CONFLICT` | `Idempotency key belongs to a different payment request` | SUPPORT |
| 409 | `PAYMENTS_TEMPORARILY_DISABLED` | `New payments are temporarily disabled` | SUPPORT |
| 409 | `ACCOUNT_DELETION_BLOCKED` | `Account is not active` / `Account has unresolved obligations: …` | SUPPORT |
| 409 | `USER_REPORT_ALREADY_OPEN` | `Report already open` | USER_ACTIONABLE |
| 409 | `USER_REPORT_CLOSED` | `Report already closed` | USER_ACTIONABLE |

## Codes to add (user-reachable flows)

Suggested stable codes for the messages the frontend currently matches by exact
string. Adding these makes the mapping locale-proof.

### Rooms — join / capacity / start-date / lifecycle

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `ROOM_JOIN_AFTER_START` | Cannot join room after start date | USER_ACTIONABLE |
| 400 | `ROOM_NOT_JOINABLE` | Room is not available for joining | USER_ACTIONABLE |
| 400 | `ROOM_PAYMENT_WINDOW_CLOSED` | Payment window is closed for this room | USER_ACTIONABLE |
| 400 | `ROOM_NO_SLOTS` | No available slots in this room | USER_ACTIONABLE |
| 400 | `ROOM_ALREADY_JOINED` | User has already joined this room | USER_ACTIONABLE |
| 400 | `ROOM_OWNER_CANNOT_JOIN` | Room owner cannot join own room | USER_ACTIONABLE |
| 400 | `CONSENT_REQUIRED` | Consent must be accepted | USER_ACTIONABLE |
| 400 | `ROOM_EDIT_ONLY_OPEN` | Only OPEN rooms can be updated | USER_ACTIONABLE |
| 400 | `ROOM_EDIT_AFTER_START` | Room cannot be updated after start date | USER_ACTIONABLE |
| 400 | `ROOM_NOT_BLOCKED` | Room is not blocked | USER_ACTIONABLE |
| 400 | `ROOM_MIN_MEMBERS` | Max members must be at least 2 / maxMembers must be at least 2 | USER_ACTIONABLE |
| 400 | `ROOM_START_IN_FUTURE` | Start date must be in the future | USER_ACTIONABLE |
| 400 | `TELECOM_TERMS_REQUIRED` | Operator terms must be confirmed for TELECOM room | USER_ACTIONABLE |
| 400 | `TELECOM_CONNECTION_REQUIRED` | Connection type is required for TELECOM room | USER_ACTIONABLE |
| 400 | `TELECOM_PROVIDER_REQUIRED` | Provider name is required for TELECOM room | USER_ACTIONABLE |

### Membership

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `ACCESS_NOT_CONFIRMED_BY_OWNER` | Owner has not confirmed access yet | USER_ACTIONABLE |
| 400 | `CONFIRM_ONLY_PENDING` | Access can only be confirmed for PENDING membership | USER_ACTIONABLE |
| 400 | `COMPLAINT_ALREADY_OPEN` | There is already an open complaint for this membership | USER_ACTIONABLE |

### Payments

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `PAYMENT_INACTIVE_USER` | Inactive users cannot create payments | USER_ACTIONABLE |
| 400 | `SAVED_CARD_UNAVAILABLE` | Saved card not found or inactive | USER_ACTIONABLE |
| 403 | `IDEMPOTENCY_OWNER_MISMATCH` | Idempotency key belongs to another user | SUPPORT |

### Payout / card binding (owner)

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 404 | `PAYOUT_CARD_INACTIVE` | Card is not active | USER_ACTIONABLE |
| 404 | `CARD_BINDING_NOT_FOUND` | Card binding not found | USER_ACTIONABLE |
| 400 | `PAYOUT_AMOUNT_INVALID` | Payout amount must be greater than zero | SUPPORT |

### Refunds / disputes (user-visible)

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `DISPUTE_ALREADY_DECIDED` | Dispute has already been decided | USER_ACTIONABLE |
| 400 | `REFUND_APPROVED_NO_REJECT` | Approved refund request cannot be rejected | USER_ACTIONABLE |
| 400 | `REFUND_REJECTED_NO_APPROVE` | Rejected refund request cannot be approved | USER_ACTIONABLE |

### Support tickets

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `TICKET_CLOSED_NO_WRITE` | Cannot write to closed ticket | USER_ACTIONABLE |
| 403 | `TICKET_NOT_OWNED` | You can only write to your own ticket | SUPPORT |
| 403 | `TICKET_MEMBERSHIP_MISMATCH` | You cannot create ticket for this membership | USER_ACTIONABLE |
| 403 | `MESSAGE_EMPTY` | Message is empty | USER_ACTIONABLE |

### Reviews & reports

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `REVIEW_SELF` | Cannot review yourself | USER_ACTIONABLE |
| 400 | `REPORT_SELF` | Cannot report yourself | USER_ACTIONABLE |
| 400 | `REPORT_DESCRIPTION_TOO_SHORT` | Report description must contain at least 20 characters | USER_ACTIONABLE |
| 409 | `SERVICE_REVIEW_DUPLICATE` | You have already submitted a service review | USER_ACTIONABLE |
| 400 | `REPORT_REQUIRES_PAID_MEMBERSHIP` | Only a paid active or pending membership can be reported | USER_ACTIONABLE |

### Profile / slug / email

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `SLUG_INVALID` | Invalid slug | USER_ACTIONABLE |
| 409 | `SLUG_TAKEN` | Slug is already taken | USER_ACTIONABLE |
| 400 | `EMAIL_ALREADY_OWNED` | This email is already attached to your account | USER_ACTIONABLE |
| 403 | `PHONE_VERIFICATION_REQUIRED` | Verify your phone number before creating a room | USER_ACTIONABLE |

### Verification codes

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `VERIFICATION_CODE_INVALID` | Invalid verification code | USER_ACTIONABLE |
| 400/410 | `VERIFICATION_CODE_INVALID_OR_EXPIRED` | Invalid or expired verification code | USER_ACTIONABLE |

### Avatar / image upload

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 400 | `FILE_REQUIRED` | File is required / Файл не передан | USER_ACTIONABLE |
| 400 | `FILE_TOO_LARGE` | File is too large | USER_ACTIONABLE |
| 400 | `IMAGE_DIMENSIONS_TOO_LARGE` | Image dimensions are too large | USER_ACTIONABLE |
| 400 | `IMAGE_TYPE_UNSUPPORTED` | Only PNG and JPG files are supported / Разрешены только файлы png, jpg, jpeg | USER_ACTIONABLE |
| 400 | `IMAGE_INVALID` | File is not a valid image / Файл не похож на изображение (неверная сигнатура) | USER_ACTIONABLE |
| 400 | `IMAGE_DECODE_FAILED` | Failed to decode image / Не удалось декодировать изображение | USER_ACTIONABLE |

### Rate limits

| HTTP | suggested code | English message | Class |
| --- | --- | --- | --- |
| 429 | `CODE_RESEND_TOO_SOON` | Please wait before requesting another code. | USER_ACTIONABLE |
| 429 | `CONFIRMATION_EMAIL_RATE_LIMIT` | Too many confirmation emails. Try again later. | USER_ACTIONABLE |
| 429 | `USER_REPORT_RATE_LIMIT` | Too many user reports. Try again later. | USER_ACTIONABLE |

## INTERNAL — must NEVER reach a user (any language)

These resolve to `null` in `resolveServerMessage` so the UI shows a generic
localized fallback. Backend should prefer a generic 5xx body for these; if a
`code` is sent, keep it out of any user-facing surface.

| HTTP | English message | Notes |
| --- | --- | --- |
| 5xx | Failed to decrypt field / Failed to encrypt field | field encryption |
| 5xx | MD5 not available / SHA-256 not available / SHA-256 is unavailable | crypto init |
| 5xx | ImageIO returned no JPEG writer | image pipeline |
| 5xx | Failed to process image / Failed to store image / Failed to read file (+ RU variants) | image pipeline |
| 5xx | bad HTTP status | outbound HTTP |
| 5xx | app.frontend-url must be configured | misconfig |
| 4xx | providerCardToken is required | integration param |
| 5xx | **Freedom Pay request failed** | provider — never surfaced |
| 5xx | **Mobizon SMS request failed / interrupted / was rejected** | provider — never surfaced |
| 5xx | Email sending interrupted / Unable to send email right now | mail provider |

## Field-level validation (`errors` map)

400 responses with a per-field `errors` map are localized by
`lib/field-errors.ts` (`localizeFieldErrors`) based on the **field name** plus a
small required/invalid heuristic — the raw English value is never rendered. New
field names should be added there, not shown raw.

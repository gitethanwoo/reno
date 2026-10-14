# Reno — brand direction and v1 mobile flows

## Decision

Use **Reno** as the working name and **Your home. Your say.** as the brand line. The name comes from the PRD's open naming question; it has not been checked for trademark, domain, or app-store availability. This package makes a creative direction decision, not a naming-clearance claim.

Reno is the homeowner's project notebook: a place to understand the price, make decisions, and keep the evidence. It should feel like a thoughtful residential design publication with the clarity of a well-kept receipt. Confident and welcoming; never confrontational toward tradespeople or patronizing toward homeowners.

### Visual system

- Warm ivory `#F8F5EF`: primary surface.
- Deep forest `#17332F`: text, primary actions, active navigation.
- Terracotta `#B84932`: decisions that need attention and destructive actions with explicit labels.
- Pale lime `#E4ECAC`: quiet status accents.
- White cards, warm-gray dividers, restrained 12px corners.
- Contemporary editorial serif for titles and the lowercase wordmark; clean sans serif for controls and tabular figures for money.
- Wordmark: lowercase `reno` followed by a small terracotta square.
- Genuine residential photography: materials, work in progress, and finished details. Avoid stock people holding tools.
- Design at 390 logical pixels wide, 24px side gutters, 16px body text, and controls at least 48px tall. Color must never carry a status alone.

These image concepts suggest typography; production font selection, contrast measurements, accessible type scaling, and component specifications remain implementation work.

### Voice

Use direct language that explains what the homeowner can decide: “You decide what changes,” “Keep the receipt,” and “A clear list of what's left.” Distinguish an estimate from a quote, recorded payments from verified bank transactions, proposed changes from approved changes, and contractor-reported completion from homeowner acceptance.

## Product boundary

Design v1 around single jobs in St. Augustine, as specified on PRD page 2. Include homeowner and contractor mobile experiences. The operational vetting console can be a separate internal web tool and is outside this mobile package.

Do not introduce new-build planning, financing, bank draws, e-signature, contract templates, a vendor marketplace, walkthrough transcription, a move-in tracker, or transferable lifetime home records. Those are later phases in the PRD. The archive here is an individual completed job record.

## Navigation

Homeowner: **Home / Projects / Guides / Account**. A project contains **Overview / Record / Money / Punch list**. Notifications deep-link to the relevant quote, question, change, or punch item.

Contractor: **Leads / Jobs / Inbox / Account**. Both roles use the same project record. Shared account, attachment, message, payment-history, and notification patterns are reused instead of creating a second design system.

## Required flows and screen map

| Flow | Screen IDs | Required behavior |
| --- | --- | --- |
| Enter and authenticate | 02 → 03 → 04 → 01 | Role entry, email one-time code, resume intended destination. Apple sign-in is an optional implementation choice shown in the concept. |
| Account and notifications | 05, 06 | Manage account, project help, privacy, exports, deletion; deep-link notifications. |
| Start or resume a job | 01 / 07 → 08 → 09 → 10 | Capture job type, location, scope, timing, current photos and inspiration. Save drafts. |
| Understand likely price | 10 → 11 | Range with assumptions and provenance, never a guaranteed price. |
| In-person exception | 08 / 11 → 12 → 13 | Withhold unreliable photo pricing; collect availability. A contractor confirms the visit through the project record. |
| Share request | 11 → 13 → 14 | Show what will be shared, with whom, and obtain explicit submission. |
| Coverage and withdrawal | 09 → 35; 14 → 50 | Do not pretend to serve an unsupported area. Preserve records when withdrawing an unawarded request. |
| Evaluate quotes | 14 → 15 → 16 / 17 | Compare the same fields, surface omissions, inspect vetting detail. Do not rank providers by their lead spend. |
| Review terms | 17 → 18 → 19 → 20 → 23 | Read source-linked AI findings and send an editable clarification question. Review is not legal advice or e-signature. |
| Choose contractor | 17 / 19 → 21 → 22 | Record selected provider and exact quote version after reviewing terms. Existing legal agreements remain outside the app in v1. |
| Communicate and document | 22 → 23 ↔ 24 | One durable record for messages, photos, quotes, approved changes and logged payments. |
| Decide on a change | 23 → 25 → 49 → 22 | Show the delta and new totals before approval; allow decline or question. Only approval changes the agreed budget and schedule. |
| Track money | 22 → 26 → 27 → 26 | Log external payments with date, method, milestone and receipt. Do not imply money movement. |
| Resolve unfinished work | 22 → 28 → 29 / 30 | Add evidence, assign an item, let the contractor propose resolution, let the homeowner accept or reopen. |
| Finish and retain evidence | 28 → 31 → 32 | Homeowner confirms completion. Keep quote, changes, receipts, photos and punch history together. Export the record. |
| Learn and buy a digital product | 33 → 34; 33 → 47 → 48 | Free guides, saved library, paid downloadable work-order worksheet. Hosted checkout and a confirmed payment return are required before granting access. |
| Contractor joins | 02 → 37 → 38 | Collect business details and applicable verification documents. Lead purchasing stays disabled until review succeeds. |
| Contractor obtains lead | 39 → 40 → 41 | Show scope and ZIP before purchase, clearly price the lead, do not promise a hire. Unlock contact only after confirmed payment. |
| Contractor quotes | 41 → 42 → 43 | Itemize the same fields the homeowner compares; include dates, exclusions, deposit and attachments. Preserve sent versions. |
| Contractor performs job | 43 → 44 → 23 / 24 / 45 | Post updates and propose changes. Never silently modify accepted terms. |
| Contractor resolves punch item | 44 → 46 → 30 | Submit after-photo and comment; homeowner decides whether it is resolved. |
| Recover an interruption | 18 → 36 → 18 | Preserve draft data; retry uploads or resume later. |

## State requirements for implementation

The 50 images are a first pass of screen concepts, not a claim that every possible state is fully designed. Reuse patterns for loading, no projects, no leads, no quotes, no notifications, invalid code, resend throttling, missing form fields, rejected files, offline drafts, failed checkout, expired quotes, revised quotes, declined changes, verification pending/rejected, and completed or cancelled jobs. Do not route a failed operation into its success screen.

- Every submit, purchase, approval, and completion action must be idempotent and show its actual saved status.
- Declined changes stay in the record; the original total and dates remain unchanged. Pending changes never enter the approved budget.
- Revisions create new quote/change versions; no silent edits to accepted records.
- A homeowner may reopen a punch item with a reason. A contractor cannot mark its own work accepted.
- A saved payment is a homeowner-entered record, not proof the contractor received it. Corrections retain history.
- Withdrawing an open request differs from cancelling an active contracted job. Active-job cancellation needs a separate contact/support flow preserving the agreement and payment history.
- Camera, photo picker, keyboard, share/export sheet, Apple authentication, and hosted checkout are platform/provider surfaces; do not recreate their sensitive UI as app-owned screens.
- Exact home address and contact details require deliberate disclosure. A lead listing exposes only general location and scope.
- Account deletion, financial disputes, and credential review decisions need operational policies before implementation.

## Coherent example data

All people, providers, dates, prices, vetting checks, and project evidence shown are fictional design fixtures. No provider has been verified by this work.

Maya Chen's kitchen backsplash: original quote **$4,800** = labor $2,600 + materials $1,500 + prep/disposal $700. Original deposit **$1,440** (30%); original balance **$3,360**. Pending trim proposal **+$240 / +1 day** does not affect the approved total. After approval, total **$5,040**, remaining **$3,600**, finish **Oct 24**. Completed state records two payments totaling **$5,040**. The $25 lead fee and $12 digital product are illustrative pricing decisions awaiting commercial validation.

## Artifacts

`screen-specs.json` contains the shared visual system and all 50 screen prompts. Individual exact generation prompts live in `prompts/`. Image files live in `screens/`. `index.html` is a local, searchable review gallery, not an implemented app. The image generation tool was used for the screen artwork; gallery code only organizes the outputs.

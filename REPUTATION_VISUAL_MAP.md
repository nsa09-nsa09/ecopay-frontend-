# EcoPay: Reputation & Reviews — Visual Component Map

## Desktop Layout (1440px)

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER (Fixed)                           │
│  [Logo] [Catalog] [My Rooms] [Support] [About] [🔍] [Рус] [👤] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Public Profile                             │
│  max-width: 1200px, centered                                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬──────────────────────────────┐
│         MAIN CONTENT             │        SIDEBAR (380px)       │
│                                  │                              │
│ ┌──────────────────────────────┐ │ ┌──────────────────────────┐ │
│ │   PROFILE CARD               │ │ │  REPUTATION FACTORS      │ │
│ │ ┌──────┐  Айдар К.           │ │ │  ℹ️ Reputation Factors   │ │
│ │ │  АК  │  ✓ Verified         │ │ │                          │ │
│ │ │      │  Member since: 2025 │ │ │  Calculated based on:    │ │
│ │ └──────┘  Last active: 2h ago│ │ │  • Average rating        │ │
│ │                              │ │ │  • Completed periods     │ │
│ │  ┌────┬────┬────┬────┐       │ │ │  • Disputes/complaints  │ │
│ │  │847 │ 5  │ 8  │ 18 │       │ │ │  • Confirmed violations │ │
│ │  │Rep │Cre │Joi │Suc │       │ │ │                          │ │
│ │  └────┴────┴────┴────┘       │ │ │  [View Details]          │ │
│ │                              │ │ └──────────────────────────┘ │
│ │  4.6 ★★★★☆ 23 reviews       │ │                              │
│ └──────────────────────────────┘ │                              │
│                                  │                              │
│ ┌──────────────────────────────┐ │                              │
│ │   RECENT ROOMS               │ │                              │
│ │                              │ │                              │
│ │  Beeline Mega 100GB         │ │                              │
│ │  Beeline              [Owner]│ │                              │
│ │                              │ │                              │
│ │  Activ Family               │ │                              │
│ │  Activ              [Member]│ │                              │
│ │                              │ │                              │
│ │  Altel Unlim                │ │                              │
│ │  Altel              [Member]│ │                              │
│ └──────────────────────────────┘ │                              │
│                                  │                              │
│ ┌──────────────────────────────┐ │                              │
│ │   REVIEWS                    │ │                              │
│ │  Reviews [🔒 Leave a Review] │ │                              │
│ │                              │ │                              │
│ │  ⚠️ You can review only after│ │                              │
│ │     you shared a room and... │ │                              │
│ │                              │ │                              │
│ │  [All][Positive][Neg.][Rec.]│ │                              │
│ │                              │ │                              │
│ │  ┌────────────────────────┐  │ │                              │
│ │  │ (🙍) Серик А. 15d ago  │  │ │                              │
│ │  │ ★★★★★                  │  │ │                              │
│ │  │ Отличный владелец...   │  │ │                              │
│ │  │ 👍 Helpful (8)  🚩 Report│ │                              │
│ │  └────────────────────────┘  │ │                              │
│ │                              │ │                              │
│ │  ┌────────────────────────┐  │ │                              │
│ │  │ (🙍) Алия М. 1mo ago   │  │ │                              │
│ │  │ ★★★★☆                  │  │ │                              │
│ │  │ Хороший участник...    │  │ │                              │
│ │  │ 👍 Helpful (3)  🚩 Report│ │                              │
│ │  └────────────────────────┘  │ │                              │
│ └──────────────────────────────┘ │                              │
└──────────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           FOOTER                                │
│  [Product] [Company] [Support]                                  │
│  © 2026 EcoPay · Almaty, Kazakhstan                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (390px)

```
┌──────────────────────────┐
│      HEADER (Compact)    │
│ [Logo] [🔍] [Рус] [☰]   │
└──────────────────────────┘

┌──────────────────────────┐
│    Public Profile        │
└──────────────────────────┘

┌──────────────────────────┐
│ PROFILE CARD             │
│  ┌────┐                  │
│  │ АК │  Айдар К.        │
│  │    │  ✓ Verified      │
│  └────┘  Member: 2025    │
│          Last: 2h ago    │
│                          │
│  ┌────┬────┐             │
│  │847 │ 5  │             │
│  │Rep │Cre │             │
│  ├────┼────┤             │
│  │ 8  │ 18 │             │
│  │Joi │Suc │             │
│  └────┴────┘             │
│                          │
│  4.6 ★★★★☆              │
│  23 reviews              │
└──────────────────────────┘

┌──────────────────────────┐
│ RECENT ROOMS             │
│                          │
│ Beeline Mega 100GB       │
│ Beeline         [Owner]  │
│                          │
│ Activ Family             │
│ Activ          [Member]  │
└──────────────────────────┘

┌──────────────────────────┐
│ REVIEWS                  │
│ Reviews                  │
│ [🔒 Leave a Review]      │
│                          │
│ ⚠️ You can review only   │
│    after you shared...   │
│                          ��
│ ←[All][Positive][Neg.][R]→│
│                          │
│ ┌──────────────────────┐ │
│ │(🙍) Серик А. 15d ago │ │
│ │★★★★★                │ │
│ │Отличный владелец...  │ │
│ │👍 8  🚩 Report       │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │(🙍) Алия М. 1mo ago  │ │
│ │★★★★☆                │ │
│ │Хороший участник...   │ │
│ │👍 3  🚩 Report       │ │
│ └──────────────────────┘ │
└──────────────────────────┘

┌──────────────────────────┐
│ REPUTATION FACTORS       │
│ ℹ️ Reputation Factors    │
│                          │
│ Calculated based on:     │
│ • Average rating         │
│ • Completed periods      │
│ • Disputes/complaints    │
│ • Confirmed violations   │
│                          │
│ [View Details]           │
└──────────────────────────┘

┌──────────────────────────┐
│        FOOTER            │
│ [Product] [Company]      │
│ © 2026 EcoPay          │
└──────────────────────────┘
```

---

## Modal: Leave a Review

```
┌───────────────────────────────────────┐
│  Leave a Review                    ✕  │
├───────────────────────────────────────┤
│                                       │
│  Select Room                          │
│  ┌─────────────────────────────────┐ │
│  │ Beeline Mega 100GB (Beeline)  ▼ │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Your Rating                          │
│  ★★★★☆  (4 out of 5)                │
│                                       │
│  Review Text                          │
│  ┌─────────────────────────────────┐ │
│  │ Describe your sharing exp...    │ │
│  │                                 │ │
│  │                                 │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                       │
│  [Cancel]        [Submit Review]     │
│                                       │
└───────────────────────────────────────┘
```

---

## Modal: Review Submitted (Success)

```
┌───────────────────────────────────────┐
│                                       │
│            ┌──────┐                   │
│            │  ★   │                   │
│            └──────┘                   │
│                                       │
│       Review Submitted                │
│                                       │
│   Thank you for your review!          │
│                                       │
│           [Close]                     │
│                                       │
└───────────────────────────────────────┘
```

---

## Modal: Reputation Explanation

```
┌───────────────────────────────────────┐
│  Reputation Explanation            ✕  │
├───────────────────────────────────────┤
│                                       │
│  Reputation is calculated based on:   │
│                                       │
│  ┌──┐  Average rating from reviews   │
│  │★ │                                │
│  └──┘                                │
│                                       │
│  ┌──┐  Number of completed periods   │
│  │🛡│                                │
│  └──┘                                │
│                                       │
│  ┌──┐  Disputes and complaints       │
│  │⚠ │                                │
│  └──┘                                │
│                                       │
│  ┌──┐  Confirmed violations          │
│  │🚩│                                │
│  └──┘                                │
│                                       │
│  ⚠️ This review was hidden by         │
│     moderators for violating rules.  │
│                                       │
│           [Close]                     │
│                                       │
└───────────────────────────────────────┘
```

---

## Component Hierarchy

```
PublicUserProfilePage (Main Component)
│
├── Profile Header
│   ├── Avatar Circle
│   ├── Display Name
│   ├── Verification Badge (conditional)
│   ├── Member Since
│   └── Last Active
│
├── Stats Grid (2×2 mobile, 4×1 desktop)
│   ├── Reputation Score
│   ├── Rooms Created
│   ├── Rooms Joined
│   └── Successful Periods
│
├── Rating Display
│   ├── Average Rating Number
│   ├── StarRating Component
│   └── Total Reviews Count
│
├── Recent Rooms Card
│   └── Room Item (×3)
│       ├── Room Name
│       ├── Operator
│       └── Role Badge
│
├── Reviews Section Card
│   ├── Header
│   │   ├── Title
│   │   └── Leave Review Button (with lock icon)
│   │
│   ├── Eligibility Warning (conditional)
│   │   ├── Lock Icon
│   │   ├── Warning Message
│   │   └── Tooltip Text
│   │
│   ├── Filter Tabs
│   │   ├── All
│   │   ├── Positive
│   │   ├── Negative
│   │   └── Recent
│   │
│   └── Review Cards List
│       └── Review Card (×N)
│           ├── Reviewer Avatar
│           ├── Reviewer Name
│           ├── Date
│           ├── StarRating Component
│           ├── Review Text
│           ├── Moderation Badge (conditional)
│           └── Actions
│               ├── Helpful Button (with count)
│               └── Report Button
│
├── Sidebar (Desktop) / Bottom (Mobile)
│   └── Reputation Factors Card
│       ├── Info Icon
│       ├── Title
│       ├── Description
│       ├── Bullet List (×4)
│       └── View Details Button
│
├── LeaveReviewModal (Conditional)
│   ├── Form View
│   │   ├── Room Dropdown
│   │   ├── StarRating (interactive)
│   │   ├── Review Textarea
│   │   └── Buttons (Cancel + Submit)
│   │
│   └── Success View
│       ├── Success Icon
│       ├── Success Message
│       └── Close Button
│
└── ReputationExplanationPanel (Conditional)
    ├── Title
    ├── Description
    ├── Factors List (×4)
    │   └── Factor Item
    │       ├── Icon
    │       └── Label
    ├── Moderation Warning Box
    └── Close Button
```

---

## Color & Icon Reference

### Cards & Surfaces
```
Background:       var(--eco-bg)       #ffffff (light)
Surface:          var(--eco-surface)  #f8f8f8 (light gray)
Card:             white with border
```

### Text Colors
```
Primary Text:     var(--eco-text)           #1a1a1a (dark)
Secondary Text:   var(--eco-text-secondary) #6b6b6b (gray)
Tertiary Text:    var(--eco-text-tertiary)  #9b9b9b (light gray)
```

### Accent Colors
```
Primary:          var(--eco-primary)        #FF5722 (coral)
Success:          var(--eco-positive)       #4CAF50 (green)
Warning:          var(--eco-warning-500)    #FFA726 (orange)
Danger:           var(--eco-negative)       #F44336 (red)
```

### Icons Used
```
Star            ⭐  Ratings, reviews
Shield          🛡️  Verification, security
Lock            🔒  Locked eligibility
AlertCircle     ⚠️  Warnings, moderation
Flag            🚩  Report, violations
ThumbsUp        👍  Helpful votes
Info            ℹ️  Information
User            👤  Profile avatar placeholder
```

### Badges
```
Verified:   Green background, Shield icon
Owner:      Primary color background
Member:     Secondary color background
Moderated:  Warning color border
```

---

## Interactive States

### Buttons
```
Default:    Background + border
Hover:      Opacity 90%
Active:     Opacity 80%
Disabled:   Opacity 50%, cursor: not-allowed
```

### Star Rating (Interactive)
```
Hover:      Scale 110%, yellow fill preview
Click:      Set rating, fill selected stars
Unhovered:  Return to current rating
```

### Filter Tabs
```
Active:     Primary background, white text
Inactive:   Surface background, gray text
Transition: 200ms ease
```

### Review Actions
```
Helpful:    Hover: scale icon, Active: increment count
Report:     Hover: scale icon, Click: show modal
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */

/* Small mobile (default) */
@media (min-width: 0px) {
  /* Single column */
  /* 2×2 stats grid */
  /* Full-width cards */
}

/* Medium mobile/phablet */
@media (min-width: 390px) {
  /* Slightly wider cards */
}

/* Tablet */
@media (min-width: 768px) {
  /* Increased padding */
  /* 4-column stats grid */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Two-column layout */
  /* Fixed sidebar (380px) */
  /* Main content flex-1 */
}

/* Large desktop */
@media (min-width: 1440px) {
  /* Max-width container (1200px) */
  /* Centered layout */
}
```

---

## Accessibility Notes

### Keyboard Navigation
- All buttons: Tab-navigable
- Star rating: Arrow keys to change rating
- Filter tabs: Arrow keys + Enter
- Modals: Esc to close

### Screen Reader Support
- Alt text for all icons
- ARIA labels for interactive elements
- Semantic HTML (h1, h2, section, etc.)
- Skip links for main content

### Color Contrast
- Text meets WCAG AA (4.5:1)
- Interactive elements meet WCAG AA (3:1)
- Focus indicators visible

---

**Last Updated**: April 3, 2026
**Component File**: `/src/app/components/reputation/public-profile.tsx`
**Route**: `/user/:id`

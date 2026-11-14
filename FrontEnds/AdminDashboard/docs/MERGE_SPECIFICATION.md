# EduCentral Dashboard — Merge Specification Document

**Document Version:** 1.0  
**Date:** February 3, 2025  
**Status:** Technical Specification & Integration Roadmap  
**Projects:** ArkaSoftwareSeminar + EduCentralDashboard → EduCentralDashboard (unified)

---

## Executive Summary

This document describes the technical specification for merging two React/Next.js applications into a single unified platform. **EduCentralDashboard** serves as the base application, with **ArkaSoftwareSeminar** functionality integrated to deliver a complete educational management and live seminar platform.

The merged application supports two primary user personas:
- **Admin/Teacher** — Full dashboard access; manages content, users, courses, articles, seminars, and live rooms
- **Student** — Enters live seminar rooms via shared links; may log in as participant or guest (when allowed)

---

## Part 1: Project Analysis

### 1.1 ArkaSoftwareSeminar — Overview

**Purpose:** A seminar and class management platform for programming instructors, with live rooms, student CRM, payment plans, and AI-powered meeting summaries.

| Category | Details |
|----------|---------|
| **Primary Users** | Organizers (instructors), Admins, Presenters, Participants (students), Guests |
| **Data Model** | Mock data (users, rooms, payment plans) |
| **Authentication** | Mock; sessionStorage for user; organizer login at `/login`, student login at room entry |
| **Key Differentiators** | Live seminar rooms, payment/plan management, recording, AI summaries, Jalali calendar |

**Core Capabilities:**
- Dashboard with charts, upcoming payment reminders, recording history
- Room definition (duration, guest limits, participant assignment)
- User & Student CRM with payment plans (hourly/package, cash/installment)
- Class scheduling (Gregorian + Jalali)
- Live rooms: video/audio, screen share, chat, file sharing
- In-seminar recording (screen + webcam composite)
- AI meeting summaries (Genkit/Gemini)
- Appearance customization (themes, colors, fonts, RTL/LTR)

---

### 1.2 EduCentralDashboard — Overview

**Purpose:** An admin dashboard for managing educational content, users, courses, articles, and seminars. API-backed and production-oriented.

| Category | Details |
|----------|---------|
| **Primary Users** | Super Admin, Admin, Teacher, User (student) |
| **Data Model** | REST API (`https://localhost:5001/api/Service`) |
| **Authentication** | API login; token + user data in localStorage |
| **Key Differentiators** | Courses, articles, categories, comments, reviews, multi-language (en/fa) |

**Core Capabilities:**
- Dashboard with sales, tickets, notifications, articles, enrollment, traffic, instructors
- Course management (CRUD, categories, training plans, reviews)
- Article management (CRUD, comments, moderation)
- Seminar management (schedule, participants, status)
- User management (add, remove, block/unblock)
- Settings (profile, site, dashboard)
- Language provider (en/fa, RTL support)

---

## Part 2: Data & Type Model Comparison

### 2.1 User Models

| ArkaSoftwareSeminar User | EduCentralDashboard User |
|--------------------------|---------------------------|
| `id`, `name`, `displayName`, `username`, `password`, `email`, `emailVerified` | `id`, `name`, `email`, `avatarUrl`, `initials`, `status`, `registrationDate`, `lastLogin`, `role` |
| `role`: organizer \| admin \| presenter \| participant \| guest | `role`: Super Admin \| Admin \| User |
| `avatar`, `contactNumber` | — |
| `paymentPlan`, `paymentHistory`, `planHistory` | — |

**Merge Strategy:** Introduce `SeminarUser` and `SeminarRoom` types in EduCentral to support seminar-specific roles and payment plans, while keeping the existing `User` for dashboard/admin.

### 2.2 Room vs Seminar

| ArkaSoftwareSeminar Room | EduCentralDashboard Seminar |
|--------------------------|-----------------------------|
| Live meeting room (video/chat) | Scheduled event (metadata, participants) |
| `organizerId`, `participants`, `participantRoles`, `allowGuests`, `guestLimit`, `duration` | `title`, `date`, `location`, `attendees`, `status`, `description`, `category`, `level` |

**Merge Strategy:** Treat as distinct concepts. **Seminar** = event metadata; **Room** = live meeting container linked to a seminar or used standalone.

---

## Part 3: Integration Status

### 3.1 Completed

| Item | Location | Notes |
|------|----------|-------|
| Seminar room types | `src/lib/types.ts` | `SeminarRoom`, `SeminarUser`, `SeminarPaymentPlan`, etc. |
| Seminar mock data | `src/lib/seminar-mock-data.ts` | Rooms, users, helpers |
| Seminar context | `src/contexts/seminar-context.tsx` | Unifies admin (AuthProvider) + student (room login) |
| Room entry flow | `src/app/room/[id]/page.tsx` | Entry point for live rooms |
| Room components | `src/components/seminar/` | Entry point, participant login, rooms dashboard, room form, organizer setup, seminar room, leave dialog |
| Rooms management page | `src/app/dashboard/rooms/page.tsx` | Admin room CRUD |
| Sidebar navigation | `dashboard-client-layout.tsx` | "Live Rooms" (nav_rooms) |
| Locale entries | `public/locales/en.json`, `fa.json` | nav_rooms |
| Root layout | `src/app/layout.tsx` | SeminarProvider wrapped |

### 3.2 Partial / Simplified

| Item | Current State | Gap |
|------|---------------|-----|
| Seminar room | Basic video, chat, screen share, leave | No recording, file upload, settings dialog, video summary |
| Room participants | Static list from mock users | No real-time presence or roles management |
| Recording | Not implemented | No composite recording, download, or save |

---

## Part 4: Gaps & Missing Features

### 4.1 High Priority

| # | Feature | Source | Description |
|---|---------|--------|-------------|
| 1 | Seminar Students with Payment Plans | ArkaSoftwareSeminar | Dedicated "Seminar Students" section; student profiles with payment plans, plan history, payment history; manage plans per student |
| 2 | Full Seminar Room | ArkaSoftwareSeminar | Recording (screen + webcam composite), file upload/share, seminar settings (devices, recording, image, webcam overlay), leave timer |
| 3 | AI Summary Generation | ArkaSoftwareSeminar | Genkit flows for meeting and video summaries; summary page and export |
| 4 | Class Scheduling | ArkaSoftwareSeminar | Calendar for scheduling classes; Gregorian and Jalali (date-fns-jalali); link to rooms |

### 4.2 Medium Priority

| # | Feature | Source | Description |
|---|---------|--------|-------------|
| 5 | Add-Class Dialog | ArkaSoftwareSeminar | Assign classes to rooms; requires `Class` type and multi-select |
| 6 | Student Profile Detail | ArkaSoftwareSeminar | `/dashboard/users/[userId]` with plan history, payment history, schedule-class |
| 7 | Dashboard Widgets (Seminar) | ArkaSoftwareSeminar | Upcoming payments, recording history on main dashboard |
| 8 | Appearance Settings (Seminar) | ArkaSoftwareSeminar | Color themes, headline font, base font size, storage settings |

### 4.3 Lower Priority

| # | Feature | Source | Description |
|---|---------|--------|-------------|
| 9 | SignalR / Real-time | ArkaSoftwareSeminar | Real-time presence and messaging (currently stubbed) |
| 10 | Export to Word | ArkaSoftwareSeminar | Summary export (docx, file-saver) |
| 11 | ArkaSoftware-specific UI | ArkaSoftwareSeminar | Color picker, uploading-file, theme-toggle, breadcrumb |

### 4.4 Dependencies to Add (EduCentralDashboard)

| Package | Purpose |
|---------|---------|
| `react-dropzone` | File upload in seminar room |
| `date-fns-jalali` | Jalali calendar support |
| `docx` | Export summaries to Word |
| `file-saver` | File download helpers |

---

## Part 5: Architecture & Conventions

### 5.1 User Flows

```
Admin:
  /login (API) → /dashboard → Courses | Articles | Seminars | Live Rooms | Users | Settings
  From Rooms → Enter Room → Full organizer controls (recording, settings, leave timer)

Student:
  /room/[id] (shared link) → Participant Login (or Guest if allowed) → Seminar Room (viewer/participant)
```

### 5.2 Auth Model

- **AuthProvider:** API login for dashboard; token + user in localStorage
- **SeminarProvider:** Exposes unified "room user":
  - If AuthProvider has user → map to organizer (id: seminar-user-1) for room entry
  - Else → use room student from sessionStorage (Participant Login)
- **Room student:** Stored in sessionStorage; cleared on leave or logout

### 5.3 Naming Conventions

- **Seminar types:** `SeminarRoom`, `SeminarUser`, `SeminarPaymentPlan`, etc. (avoid clash with EduCentral `User`, `Seminar`)
- **Components:** `src/components/seminar/` for live room and room-related UI
- **Routes:** `/dashboard/rooms` (admin), `/room/[id]` (entry, no dashboard layout)

### 5.4 Data Sources

- **Dashboard data:** Existing API (courses, articles, users, seminars)
- **Seminar rooms & students:** Mock data for now; to be replaced by API when backend supports it

---

## Part 6: Implementation Roadmap

### Phase 1 — Core Seminar Features (Current)

- [x] Types and mock data
- [x] Seminar context and room entry
- [x] Basic seminar room (video, chat, screen share)
- [x] Rooms management and navigation

### Phase 2 — Seminar Students & Plans ✅

- [x] Seminar Students dashboard section
- [x] Student profile with plan and payment history
- [x] Manage Plan dialog
- [x] Payment History dialog
- [x] Plan History details
- [x] Schedule Class dialog

### Phase 3 — Advanced Seminar Room

- [ ] Recording (screen + webcam composite)
- [ ] File upload and sharing
- [ ] Seminar settings (devices, recording, image, overlay)
- [ ] Leave room with timer
- [ ] Audio visualizer
- [ ] Color picker and related UI

### Phase 4 — AI & Scheduling

- [ ] Genkit flows for meeting and video summary
- [ ] Summary page and export
- [ ] Class scheduling calendar (Gregorian + Jalali)
- [ ] Add Class to Room

### Phase 5 — Polish & Integration

- [x] Dashboard widgets (seminar quick links)
- [ ] Appearance settings (themes, fonts)
- [ ] API integration for rooms and seminar students (when backend is ready)
- [ ] E2E tests and documentation

---

## Part 7: File Structure (Target)

```
EduCentralDashboard_Code/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── rooms/           # Live rooms management
│   │   │   ├── seminar-students/ # (New) Student CRM with plans
│   │   │   ├── summary/         # (New) AI summary
│   │   │   ├── courses/
│   │   │   ├── articles/
│   │   │   ├── seminars/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── room/[id]/           # Live room entry
│   │   └── login/
│   ├── components/
│   │   ├── seminar/             # Room & seminar-specific UI
│   │   └── ...
│   ├── contexts/
│   │   ├── seminar-context.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── seminar-mock-data.ts
│   │   ├── types.ts
│   │   └── ...
│   └── ai/
│       └── flows/               # (New) Summary flows
└── docs/
    └── MERGE_SPECIFICATION.md   # This document
```

---

## Part 8: Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Duplicate User concepts | Keep `User` (EduCentral) and `SeminarUser` (rooms) distinct; map where needed |
| API vs mock data | Use mock for seminar features until backend supports them; design services for easy swap |
| Genkit version mismatch | Align on single Genkit + provider (e.g., google-genai); migrate flows as needed |
| Bundle size | Code-split seminar room; lazy-load heavy components (e.g., TipTap, recording) |

---

## Appendix A: Mock Credentials (Development)

**Admin (EduCentral API):** Use configured API credentials (e.g., arkasoftware1@gmail.com / 123456).

**Room Participants (Mock):**
- participant1 / password123
- participant2 / password123
- participant3 / password123

**Room URLs:** `/room/room-1`, `/room/room-2`, `/room/room-3`

---

## Appendix B: References

- ArkaSoftwareSeminar: `ArkaSoftwareSeminarApp_Finally/`
- EduCentralDashboard: `EduCentralDashboard_Code/`
- Blueprints: `docs/blueprint.md` (each project)
- ArkaSoftware README: `ArkaSoftwareSeminarApp_Finally/README.md`

---

*Document maintained as the single source of truth for the merge specification and implementation status.*

# LabSync - HackerRank Lab Management System

## Implementation Plan v1.0

### 🎯 Project Overview
A web-based Lab Submission System that connects HackerRank profiles to academic lab tracking, enabling seamless submission verification and progress monitoring.

---

## Phase 1: Project Foundation

### 1.1 Initialize Next.js Project
- Create Next.js 14 app with TypeScript
- Configure TailwindCSS
- Setup shadcn/ui components
- Configure project structure

### 1.2 Setup Appwrite
- Create Appwrite project
- Configure authentication (email/password)
- Create database collections:
  - `users` (extended profile with role)
  - `problems` (lab problems)
  - `submissions` (student submissions)
  - `labs` (lab assignments)

---

## Phase 2: Authentication System

### 2.1 Auth Pages
- `/login` - Unified login page
- `/register` - Student/Teacher registration
- `/forgot-password` - Password recovery

### 2.2 Role-Based Access
- Student role: Access to personal dashboard, submission sync
- Teacher role: Access to admin panel, class management
- Middleware for route protection

---

## Phase 3: Student Features

### 3.1 Onboarding
- HackerRank username linking (one-time setup)
- Username validation (check if valid HackerRank profile)

### 3.2 Student Dashboard
- View assigned labs and problems
- Problem status indicators:
  - 🔴 Not Started
  - 🟡 Attempted
  - 🟢 Solved
- Sync button to fetch latest HackerRank status

### 3.3 Submission System
- Manual sync trigger
- Submission URL validation
- Display accepted code (if available)

---

## Phase 4: Teacher Features

### 4.1 Teacher Dashboard
- Class overview with completion statistics
- Student progress table
- Quick filters (by lab, by problem, by status)

### 4.2 Problem Management
- Create/Edit labs
- Add problems with HackerRank slug
- Set deadlines

### 4.3 Submission Review
- View any student's submissions
- Code preview with syntax highlighting
- Bulk status viewing

### 4.4 Export & Analytics
- Export to Excel/CSV
- Completion percentage charts
- Deadline tracking

---

## Phase 5: HackerRank Integration

### 5.1 Profile Verification
- Validate HackerRank username exists
- Store profile link

### 5.2 Submission Verification (Option 2 - Manual Sync)
Since API access may be limited:
- Student submits HackerRank submission URL
- System validates URL format
- System attempts to verify:
  - Username matches
  - Problem slug matches
  - Status is "Accepted"
- Manual fallback: Teacher approval

---

## Database Schema

### Users Collection
```json
{
  "id": "string (auto)",
  "name": "string",
  "email": "string",
  "role": "student | teacher",
  "hackerRankUsername": "string | null",
  "hackerRankVerified": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Labs Collection
```json
{
  "id": "string (auto)",
  "title": "string",
  "description": "string",
  "labNumber": "integer",
  "subject": "string",
  "deadline": "datetime | null",
  "createdBy": "string (userId)",
  "createdAt": "datetime"
}
```

### Problems Collection
```json
{
  "id": "string (auto)",
  "title": "string",
  "hackerRankSlug": "string",
  "hackerRankUrl": "string",
  "labId": "string",
  "difficulty": "easy | medium | hard",
  "points": "integer",
  "createdAt": "datetime"
}
```

### Submissions Collection
```json
{
  "id": "string (auto)",
  "userId": "string",
  "problemId": "string",
  "labId": "string",
  "status": "not_started | attempted | solved",
  "language": "string | null",
  "code": "string | null",
  "submissionUrl": "string | null",
  "submittedAt": "datetime | null",
  "verifiedAt": "datetime | null",
  "verifiedBy": "string | null (teacherId for manual verification)"
}
```

---

## UI/UX Design Principles

### Color Palette (Dark Mode Primary)
- Background: `#0a0a0f` (Deep dark)
- Surface: `#12121a` (Card surfaces)
- Primary: `#6366f1` (Indigo)
- Success: `#22c55e` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Text: `#f8fafc` (Light)

### Key UI Elements
- Glassmorphism cards
- Animated progress indicators
- Smooth page transitions
- Responsive design (mobile-first)
- Syntax-highlighted code blocks

---

## File Structure

```
labSync/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── student/
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── labs/page.tsx
│   │   │   ├── submissions/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── teacher/
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── labs/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   ├── submissions/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...route]/route.ts
│   │   ├── hackerrank/verify/route.ts
│   │   ├── submissions/sync/route.ts
│   │   └── export/route.ts
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/
│   ├── dashboard/
│   ├── labs/
│   └── submissions/
├── lib/
│   ├── appwrite.ts
│   ├── utils.ts
│   └── hackerrank.ts
├── types/
│   └── index.ts
├── middleware.ts
└── package.json
```

---

## Milestones

| Milestone | Description | ETA |
|-----------|-------------|-----|
| M1 | Project setup + Auth UI | Day 1 |
| M2 | Student dashboard + HackerRank linking | Day 2 |
| M3 | Teacher dashboard + Lab management | Day 3 |
| M4 | Submission tracking + Sync | Day 4 |
| M5 | Export + Analytics | Day 5 |
| M6 | Polish + Deployment | Day 6 |

---

## Next Steps
1. Initialize Next.js project
2. Setup Appwrite connection
3. Build authentication flow
4. Create dashboard layouts
5. Implement core features

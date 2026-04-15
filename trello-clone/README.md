# Trello Clone — Kanban Project Management Tool

A full-stack Kanban-style project management web app built with **Next.js 16**, **Prisma**, and **SQLite**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (Node.js) |
| Database | SQLite (local) via Prisma ORM |
| Drag & Drop | @hello-pangea/dnd |
| Icons | lucide-react |

---

## Features

### ✅ Core Features
- **Board Management** — Create multiple boards with custom background colors; view all boards on the home page
- **List Management** — Create, edit (click title to rename), and delete lists; drag & drop to reorder
- **Card Management** — Create, edit title/description, delete, archive, and drag & drop cards between lists
- **Card Details**
  - Labels — Add/remove colored labels (10 preset colors)
  - Due Date — Set a due date; overdue cards are highlighted in red
  - Checklist — Add/remove items, mark as complete, progress bar
  - Members — Assign/unassign members from a list of seeded users
- **Search & Filter** — Filter cards by title, label color, member, or due date

### ⭐ Bonus Features
- Multiple boards support
- Board background color customization
- Responsive layout (mobile, tablet, desktop)
- File attachments on cards
- Comments and activity log on cards

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up the Database
```bash
# Push schema to local SQLite database
npx prisma db push

# Seed with sample board, lists, cards, and members
npx ts-node -P tsconfig.seed.json prisma/seed.ts
```

### 3. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

```
User          — id, name, email
Board         — id, title, bgImgRes, createdAt
List          — id, title, order, boardId → Board
Card          — id, title, description, order, dueDate, archived, listId → List
Label         — id, color, text, cardId → Card
ChecklistItem — id, text, completed, cardId → Card
Comment       — id, text, author, createdAt, cardId → Card
Attachment    — id, filename, url, createdAt, cardId → Card
User ↔ Card   — many-to-many (members)
```

---

## Assumptions

- No authentication required — a default workspace is shown to all users
- Sample members (Alice, Bob, Carol, Dave) are seeded for the assignment functionality
- SQLite is used for local development (was originally configured for Neon PostgreSQL)
- The `archived` field soft-hides cards from the board view without deletion

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home (boards list)
│   ├── board/[boardId]/
│   │   ├── page.tsx              # Board page (SSR data fetch)
│   │   └── BoardWrapper.tsx      # Interactive board (drag & drop, filters)
│   └── api/
│       ├── boards/               # GET all, POST create
│       ├── boards/[boardId]/     # GET single board with lists+cards
│       ├── lists/                # POST create
│       ├── lists/[listId]/       # PATCH rename, DELETE
│       ├── lists/reorder/        # PUT reorder
│       ├── cards/                # POST create
│       ├── cards/[cardId]/       # PATCH update, DELETE
│       ├── cards/[cardId]/labels/         # POST add label
│       ├── cards/[cardId]/labels/[labelId]/ # DELETE label
│       ├── cards/[cardId]/members/        # POST assign, DELETE unassign
│       ├── cards/[cardId]/checklists/     # POST add item
│       ├── cards/[cardId]/comments/       # GET/POST comments
│       ├── cards/[cardId]/attachments/    # GET/POST attachments
│       ├── cards/reorder/        # PUT reorder
│       ├── checklists/[id]/      # PATCH toggle, DELETE
│       ├── comments/[id]/        # DELETE
│       ├── attachments/[id]/     # DELETE
│       └── users/                # GET all users
├── components/
│   ├── CardModal.tsx             # Full card detail modal
│   └── CreateBoardButton.tsx     # Board creation UI
└── lib/
    └── prisma.ts                 # Prisma client singleton
```


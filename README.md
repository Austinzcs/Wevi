# Wevi 🌍

**Plan group trips without the chaos.**

Wevi helps friend groups coordinate travel — find a common time window, vote on destinations, and generate a shared AI-powered itinerary.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL via **Supabase** |
| ORM | Prisma |
| Auth | NextAuth.js v5 (credentials) |
| Email | Nodemailer (SMTP) |
| AI | OpenAI GPT-4o mini |
| Deployment | **Vercel** |

---

## Getting Started (Local Dev)

### 1. Clone & install

```bash
git clone <your-repo>
cd wevi
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection string**
3. Copy the **URI** (Transaction mode, port 6543) → `DATABASE_URL`
4. Copy the **URI** (Session mode, port 5432) → `DIRECT_URL`

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-gmail-app-password"
EMAIL_FROM="Wevi <noreply@wevi.app>"

OPENAI_API_KEY="sk-..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push database schema

```bash
npm run db:push        # Push schema to Supabase
npm run db:generate    # Generate Prisma client
npm run db:seed        # (Optional) seed demo data
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/<you>/wevi.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Build Command** to: `prisma generate && next build`
4. Add all environment variables from `.env.local`
   - Change `NEXTAUTH_URL` → your Vercel URL (e.g. `https://wevi.vercel.app`)
   - Change `NEXT_PUBLIC_APP_URL` → same Vercel URL

### 3. Deploy

Vercel will auto-deploy on every push to `main`. ✅

---

## Project Structure

```
wevi/
├── app/
│   ├── (auth)/           # Login & Register pages
│   ├── (app)/            # Protected app pages
│   │   ├── dashboard/    # Trip list
│   │   └── trips/[id]/   # Trip detail, availability, destination, itinerary
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + register
│   │   ├── trips/        # CRUD + invite + availability + destinations + itinerary
│   │   ├── invite/       # Accept invitation
│   │   └── itinerary/    # Edit itinerary items
│   └── invite/[token]/   # Public invite accept page
├── components/
│   ├── layout/           # Navbar
│   ├── trips/            # Trip cards, invite panel
│   ├── availability/     # Availability form
│   ├── destinations/     # Add destination, vote, confirm
│   ├── itinerary/        # Generate button, edit item
│   └── invite/           # Accept invite button
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client singleton
│   ├── email.ts          # Nodemailer helpers
│   ├── openai.ts         # AI itinerary generation
│   └── utils.ts          # Helpers (cn, dates, availability calc)
├── prisma/
│   └── schema.prisma     # DB schema
└── types/
    └── index.ts          # Shared TypeScript types
```

---

## Core Features

| Feature | Description |
|---|---|
| **Auth** | Email/password registration & login |
| **Trips** | Create trips, track status through planning stages |
| **Invitations** | Email invites with 7-day expiry tokens |
| **Availability** | Each member submits their free window; app calculates overlap |
| **Destinations** | Suggest & vote on destinations |
| **AI Itinerary** | GPT-4o mini generates a day-by-day plan; editable |
| **Email reminders** | Daily reminders to members who haven't submitted availability |

---

## Gmail App Password Setup

1. Enable 2FA on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password for "Mail"
4. Use it as `SMTP_PASS` (not your regular password)

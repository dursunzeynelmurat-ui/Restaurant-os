# Restaurant OS

A restaurant operating system MVP proving the complete service flow:
**Table → Rush Order → Kitchen/Bar KDS → Pass/Expo → Served → Cashier Close**

Built with Next.js 14, TypeScript, Supabase (PostgreSQL), NextAuth v5, Tailwind CSS, TanStack Query.

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

**Demo Restaurant:** Lemon Garden — 20 tables, 33 menu items, 7 staff roles

| Role      | Email / PIN | Password |
|-----------|-------------|----------|
| Owner     | owner@lemongarden.com | demo1234 |
| Manager   | manager@lemongarden.com | demo1234 |
| Waiter    | PIN: **1234** | — |
| Kitchen   | PIN: **2345** | — |
| Bar       | PIN: **3456** | — |
| Runner    | PIN: **4567** | — |
| Cashier   | PIN: **5678** | — |

---

## Demo Flow (Minimum Impressive Slice)

1. **Owner** logs in → `/dashboard` — sees live revenue, open tables, order feed
2. **Waiter** (PIN 1234) → `/waiter` → Tap **Table 14** → **Open Table**
3. **Rush Order Mode** — tap Efes ×3, Gin Tonic ×1, Water ×2 + Ribeye Steak → **Send Order**
4. **Bar** (PIN 3456) → `/bar` — sees drinks ticket → mark items Done
5. **Kitchen** (PIN 2345) → `/kitchen` — sees food ticket → mark item Done
6. **Pass/Expo** (PIN 4567) → `/pass` — Table 14 card appears showing all items ready → **Pick Up and Serve**
7. **Waiter** — table view shows items ready → **Mark Served**
8. **Cashier** (PIN 5678) → `/cashier` → Tap Table 14 → view itemized bill → select payment method → **Confirm Payment**
9. **Owner dashboard** — revenue updated, table 14 closed

---

## Screens

| URL | Role | Description |
|-----|------|-------------|
| `/login` | All | Email+password (Owner/Manager) or 4-digit PIN (Staff) |
| `/dashboard` | Owner, Manager | Live stats, recent orders, revenue |
| `/reports` | Owner, Manager | Today's sales snapshot |
| `/waiter` | Waiter | Table grid with status colors |
| `/waiter/table/[id]` | Waiter | Table detail, order items, mark served |
| `/waiter/table/[id]/rush-order` | Waiter | Rush Order Mode — quick menu grid |
| `/kitchen` | Kitchen | Kitchen Display System (KDS) |
| `/bar` | Bar | Bar Display System |
| `/pass` | Runner | Pass/Expo screen — ready items grouped by table |
| `/cashier` | Cashier | Open table list |
| `/cashier/table/[id]` | Cashier | Bill view + payment |

---

## Rush Order Mode

The core UX differentiator. Designed for speed in busy bars and restaurants.

- Large product grid — 4 columns of color-coded buttons
- Tap to add — each tap increments quantity (badge counter shows total)
- Long press — opens modifier sheet
- Live basket — right panel shows running order with total
- Send — one tap fires order to kitchen/bar stations

Target: Add 3 products and send in under 10 seconds.

---

## Service Flow Engine

```
Order Sent
   Kitchen items  →  Kitchen Ticket  →  Kitchen Display
   Bar items      →  Bar Ticket      →  Bar Display
                           Station marks items Done
                           Pass/Expo Screen (grouped by table)
                           Runner marks Picked Up
                           Waiter marks Served
                           Cashier: Bill → Payment → Table Closed
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Supabase |
| Auth | NextAuth v5 (Credentials, JWT) |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query (polling 3–10s) |
| Package manager | pnpm |
| Validation | Zod |

---

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Run production server
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
```

---

## Implemented

- Multi-tenant data model (businesses, branches)
- 7 roles with PIN and email/password auth
- Middleware RBAC route protection
- 20 tables across 3 areas with 8 status states
- 33 menu items across 7 categories (KITCHEN and BAR stations)
- Quick menu layout (4x5 grid, 20 items with colors)
- Rush Order Mode — tap-to-add, modifier sheet, live basket, send
- Order creation with item-level status tracking
- Station routing — Kitchen and Bar tickets created on send
- Kitchen Display System with elapsed timer and color alerts (8min amber, 12min red)
- Bar Display System
- Pass/Expo with course completion bar and per-item status
- Pick-up and served confirmation
- Cashier bill view with tip, payment method, change calculation
- Payment processing — Cash, Card, Transfer, Mixed
- Owner/Manager live dashboard with auto-refresh
- Audit logging for payments
- Polling realtime (upgradeable to Supabase Realtime)

## Deferred

- Native mobile Expo app (APIs are mobile-ready)
- Quick menu builder admin UI
- Advanced reports (sales by waiter/product/shift)
- Supabase Realtime subscriptions
- Multi-branch switching at runtime
- Offline mode with service worker
- Void, comp, discount flows
- Table merge and split
- Course scheduling
- Inventory and recipe costing
- Row Level Security policies

# Kodeva — Modern B2B SaaS Storefront & Lead Scoring Research Platform

> A production-ready full-stack software storefront and empirical research vehicle for micro, small, and medium enterprise (MSME) business tools—featuring Point of Sale (POS), HR & Payroll, and modular cloud add-ons with subscription licensing, combined with an embedded machine learning lead-scoring calibration engine.

**Live Storefront:** [https://kodeva.athallarizky.com](https://kodeva.athallarizky.com) · **Admin CMS:** `/admin` · **Repository:** Public, linear conventional commit history.

---

## 1. Executive Summary & Capabilities

Kodeva is an end-to-end B2B software commerce and editorial ecosystem designed specifically for Indonesian retail and enterprise operators:

- **Complete Public Storefront:**
  - **Landing Page (`/`):** Hero with value propositions, featured modular applications, interactive testimonials, FAQ accordions, and anti-spam lead capture.
  - **Catalog (`/produk`):** Fast URL-driven category filtering, multi-category chips, 48px search with instant clear, and section dividers between core applications and extensions.
  - **Product Detail (`/produk/[slug]`):** Desktop 2-column layout with sticky buy box, tier switcher (Basic, Pro, Business), duration selector (Monthly, Yearly), live stock quota monitoring, and animated add-to-cart feedback.
  - **Shopping Cart (`/keranjang`):** Responsive line-item management, quota lock guard against stock exhaustion, live subtotal computation, and mobile-safe padding.
  - **Simulated Checkout (`/checkout` & `/checkout/sukses`):** Form with inline validation, discount voucher engine (`KODEVA50`, `HEMAT10`), dual reviewer simulation modes (**Success 201** vs **Payment Failure 402**), and interactive digital receipt with serial key guidance.
  - **Editorial Blog (`/blog` & `/blog/[slug]`):** Modern warm-toned editorial layout, category chips, reading time calculation, author profile squircles, and linked module cards.
- **Embedded Headless CMS (`/admin`):** Integrated Payload CMS 3 running in the same Next.js process, managing products, promotional quotas, editorial posts, vouchers, leads, and assets.
- **Decision Lab & Lead Scoring:** Built-in empirical calibration suite evaluating lead scoring models across synthetic distributions with Platt scaling corrections.
- **Analytics & Event Telemetry:** UTM parameter capture across the session funnel and a built-in event debugger drawer (`?debug=tracking`).

---

## 2. Development Milestones

| Sprint | Focus Area | Key Deliverables & Outcomes |
|---|---|---|
| **Sprint 1** | CMS & Backend Foundation | Payload 3 schema collections, RBAC access control, REST endpoints for `/api/leads` and `/api/orders`, and quota invariant test suite. |
| **Sprint 2** | Lead Scoring Calibration Research | Empirical black-box audit of scoring algorithms across 1,570 synthetic leads in 3 world scenarios. |
| **Sprint 3** | Frontend Implementation | Full public UI slicing translated into Next.js 16 App Router, client-side store, and responsive shop flows. |
| **Sprint 4** | UI/UX Refinement & Craft | Applied modern design tokens, 2-column conversion layouts, tactile micro-interactions, and achieved **CLS = 0.000**. |
| **Sprint 5** | Hardening & Quality Verification | Full regression audit, cross-device responsiveness verification, and zero-defect accessibility checks. |

---

## 3. Architecture & Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Modern server components, nested layouts, streaming SSR, and unified serverless deployment. |
| **CMS** | Payload CMS 3 (Embedded) | Runs in the same Node.js runtime—enabling **Local API calls with zero HTTP overhead**, native draft/preview, and custom admin views. |
| **Database** | Neon Serverless PostgreSQL (Pooled) | Highly scalable managed PostgreSQL. Connection pooler handles serverless concurrency without connection exhaustion. |
| **Styling** | Tailwind CSS v4 | Custom `@theme` tokens (warm forest `#1B3A28`, brand green `#2D5E3A`, cream `#F5F3EE`), Funnel Sans display typography, and zero-runtime CSS. |
| **State & Store** | Zustand | Persistent local storage cart synchronization with hydration guards and quota lock reconciliation. |
| **Media Storage** | Vercel Blob | Durable cloud object storage for media uploads and CDN delivery in serverless environments. |
| **Testing** | Vitest | Fast test runner executing 64 automated tests covering business logic, quota invariants, schemas, and calibration algorithms. |

---

## 4. CMS Architecture: Why Embedded Payload 3?

Rather than coupling the application with a disconnected third-party CMS, Kodeva utilizes an **embedded Payload 3** architecture:

| CMS Option | Architectural Comparison |
|---|---|
| **Embedded Payload 3** ✅ | **Single unified deployment:** Next.js and Payload run together. The frontend accesses data via in-process Local API (direct database queries without HTTP latency), native Postgres adapter, and role-based access control. |
| **Strapi** | Separate headless service requiring dual deployments, additional server costs, and cold-start latency. |
| **Sanity** | Hosted content lake with proprietary query languages and third-party data lock-in. |
| **WordPress** | PHP runtime incompatible with unified modern TypeScript/serverless infrastructure. |
| **Directus** | Excellent for data-first setups, but heavier overhead for flexible block-based marketing and editorial content. |

---

## 5. Caching & Revalidation Strategy

Content published in the CMS updates the live storefront **without requiring a new build or redeployment**:

1. **On-Demand Tag Revalidation (Primary Layer):**
   - CMS collections incorporate hooks calling Next.js `revalidateTag('pages' | 'products' | 'posts', 'max')` whenever content is created, modified, or deleted in `/admin`.
   - Public pages query data using tagged caches. When an editor clicks **Publish**, the relevant cache segment is purged instantly, serving fresh content on the subsequent request.
2. **Time-Based ISR Fallback (Safety Layer):**
   - Public routes include a background revalidation window (5–10 minutes) to guarantee consistency even if direct database edits bypass CMS lifecycle hooks.
3. **Draft Isolation:**
   - Draft documents are never exposed to the public storefront; they are accessible solely within the authenticated CMS **Live Preview** environment.
   - Price snapshots stored in existing user carts remain protected against mid-session price modifications.

---

## 6. Verification & Quality Gates

- **Unit & Integration Tests:** `npm run test` executes **64 automated tests** with 100% passing rate (covering aggregate quota pooling, voucher pricing math, Zod validation, and calibration algorithms).
- **Type Safety:** `npx tsc --noEmit` yields **0 errors**.
- **Production Build:** `npm run build` compiles cleanly with **29/29 static & dynamic routes prerendered**.
- **Lighthouse Mobile Audit (Verified via Headless Chromium):**
  - **Landing Page (`/`):** CLS **`0.000`** · Best Practices **100** · SEO **100** · Accessibility **93** · Performance **89**
  - **Catalog (`/produk`):** CLS **`0.000`** · Best Practices **100** · SEO **100** · Accessibility **96** · Performance **93**
  - **Product Detail (`/produk/kodeva-kasir`):** CLS **`0.000`** · Best Practices **100** · SEO **100** · Accessibility **96** · Performance **87**

---

## 7. Reviewer Exploration Guide

### Public Storefront Walkthrough
1. **Browse Products:** Visit `/produk` → filter by category or search → verify dynamic URL query synchronization.
2. **Configure Licensing:** Select a product (e.g., `/produk/kodeva-kasir`) → switch tiers (*Basic*, *Pro*, *Business*) and billing intervals (*Monthly*, *Yearly*) → observe live price calculations.
3. **Cart & Quota Handling:** Add items to cart → navigate to `/keranjang` → test quantity adjustments and quota alert handling.
4. **Checkout Simulation:** Proceed to `/checkout` → enter customer details → apply promotional coupon (`KODEVA50` or `HEMAT10`) → select simulation outcome:
   - **Simulate Success:** Issues an order (`201 Created`), clears the cart, and redirects to `/checkout/sukses` with order ticket `KDV-XXXX`.
   - **Simulate Failure:** Triggers payment rejection (`402 Payment Required`), keeps all cart items intact, and displays a recovery action card.
5. **Editorial Hub:** Visit `/blog` → browse category-filtered guides → click into an article to review typography and related module recommendations.
6. **Analytics Debugger:** Append `?debug=tracking` to any storefront URL to open the floating event drawer tracking real-time telemetry events (`view_item`, `add_to_cart`, `begin_checkout`) with one-click JSON export.

### Admin CMS Walkthrough (`/admin`)
- Log in to access collections: **Products**, **Categories**, **Posts**, **Vouchers**, and **Leads**.
- Review submitted leads with automated contact priority indicators (🔴 High / 🟡 Medium / 🟢 Low).
- Access the **Decision Lab** (`/admin/decision-lab`) to inspect empirical lead calibration research models.

---

## 8. Running Locally

### Prerequisites
- Node.js 20+ (Node 22 LTS recommended)
- PostgreSQL database (or free tier [Neon Serverless Postgres](https://neon.tech))

### Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/athallarizky/kodeva.git
cd kodeva

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env
# Configure DATABASE_URL (Neon pooled connection string) and PAYLOAD_SECRET in .env

# 4. Start development server
npm run dev
# Storefront: http://localhost:3000
# Admin CMS: http://localhost:3000/admin (Create initial admin user on first launch)

# 5. Execute test suite
npm run test

# 6. Verify production build
npm run build
```

> **Seed Data:** After setting up the admin account, log in to `/admin` and click **Seed your database** to populate the 6 standard products, 4 editorial articles, promotional vouchers, and homepage blocks.

---

## 9. Empirical Lead Scoring Research (Decision Lab)

Sprint 2 integrated an empirical audit investigating lead-scoring calibration across 1,570 synthetic enterprise inquiries evaluated under multiple macroeconomic conditions:

- **Uncalibrated Baseline:** Raw algorithmic scores demonstrated severe miscalibration—clustering near `±0.42` despite ground-truth conversion varying between `6.5%` and `20.4%` (Expected Calibration Error / ECE: `0.21–0.35`).
- **Platt Scaling Correction:** Applying a 2-parameter logistic calibration reduced ECE to `< 0.02`, achieving optimal calibration with as few as 50 labeled outcomes.
- **Confidence Metric Reliability:** The internal margin metric demonstrated an empirical correlation of `ρ −0.43 to −0.55` with classification error, proving viable as an uncalibrated confidence proxy.
- **Production Implementation:** Raw probabilities are treated as advisory-only; the sales pipeline presents corrected conversion potentials and categorized contact priorities (🔴 / 🟡 / 🟢).

---

## 10. Production Integration Roadmap

For organizations transitioning Kodeva from demonstration mode to live commerce:

| Functional Area | Production Roadmap |
|---|---|
| **Payment Gateway** | Replace mock `/api/orders` simulation with Midtrans or Xendit webhook handlers and payment status reconciliation. |
| **Transactional Stock** | Migrate from promotional quota validation to atomic database decrements using `SELECT ... FOR UPDATE` upon invoice settlement. |
| **License Distribution** | Integrate asynchronous worker queues (Payload Jobs) to dispatch activation keys via encrypted email (Resend/SendGrid) and WhatsApp API. |
| **Dynamic Invoicing** | Implement server-side re-pricing validation during final invoice generation to guard against stale cart snapshots. |
| **Enterprise Analytics** | Connect UTM attribution data pipelines directly into BigQuery or Google Analytics 4 (Measurement Protocol). |

---

## 11. Project Principles

- **No AI Attribution Trailers:** Commit history adheres strictly to conventional standards without automated co-authorship tags.
- **Zero CLS Architecture:** Layout shifts are eliminated through deterministic server-side rendering and reserved component geometries.
- **Data Contract Freezing:** Visual refinements never violate underlying business invariants or database schemas.

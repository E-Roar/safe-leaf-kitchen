# SafeLeafKitchen Agrinova — AI Codebase Directive

> **PURPOSE**: This file exists so that AI coding assistants (Gemini Flash, GPT-4o-mini,
> Claude Haiku, etc.) can work on this codebase without hallucinating, losing context,
> or introducing regressions. **Read this file in its entirety before writing any code.**

---

## 1. What This Project Is

SafeLeafKitchen is a **React 18 + TypeScript + Vite PWA** for:
- **Leaf identification** via camera (Roboflow CV model)
- **Moroccan-cuisine recipes** featuring edible plant leaves
- **RAG-based chatbot** (OpenRouter / n8n webhook) that suggests recipes & leaf profiles
- **Impact tracking** (money saved, CO₂ avoided, polyphenols gained)
- **Admin dashboard** for managing leaves, recipes, and knowledge base (Supabase backend)

The app is styled with **TailwindCSS 3** (see `tailwind.config.ts`) and uses **shadcn/ui**
Radix primitives under `src/components/ui/`.

---

## 2. Tech Stack — Do NOT Guess

| Layer | Technology | Version |
|---|---|---|
| Runtime | Vite 7 + React 18 | `package.json` |
| Language | TypeScript 5.8 strict | `tsconfig.app.json` |
| Styling | TailwindCSS 3.4 + `index.css` custom tokens | `tailwind.config.ts` |
| UI Primitives | shadcn/ui (Radix) | `components.json` |
| State | React `useState` + `useCallback` + `useMemo` (no Redux/Zustand) | — |
| Routing | React Router DOM v6 (inside `App.tsx`) | — |
| Backend | Supabase JS v2 | `src/lib/supabaseClient.ts` |
| Charts | Recharts 2.15 | `StatsPage.tsx` |
| HTTP | Axios | `apiService.ts` |
| Icons | Lucide React | throughout |
| i18n | Custom `useI18n` hook (EN/FR/AR) | `src/hooks/useI18n.tsx` |
| PDF | `@react-pdf/renderer` | admin reports |

---

## 3. Directory Map — Exact Locations

```
src/
├── App.tsx                          # Top-level router (admin vs public)
├── PublicApp.tsx                     # Public SPA shell — manages activeTab + selectedRecipeId/selectedLeafId
├── main.tsx                         # Entry point
├── index.css                        # Global CSS + Tailwind @apply + custom tokens
├── components/
│   ├── ErrorBoundary.tsx            # Global error boundary
│   ├── layout/
│   │   └── AppLayout.tsx            # Top bar + FAB circular menu + visual effects
│   ├── layouts/
│   │   └── AdminLayout.tsx          # Admin sidebar layout
│   ├── pages/
│   │   ├── LandingPage.tsx          # Home page (hero, team, features)
│   │   ├── ChatPage.tsx             # AI chatbot (90KB — largest file!)
│   │   ├── StatsPage.tsx            # Analytics & impact dashboard
│   │   ├── RecipePage.tsx           # Recipe browser + detail view + favorites
│   │   ├── LeavesPage.tsx           # Leaf encyclopedia
│   │   └── SettingsPage.tsx         # User settings
│   ├── features/
│   │   └── CameraScanner.tsx        # Roboflow camera integration
│   ├── admin/                       # Admin CRUD pages
│   ├── auth/                        # LoginPage, ProtectedRoute
│   ├── rag/
│   │   └── KnowledgeBase.tsx        # Admin RAG knowledge management
│   ├── ui/                          # shadcn/ui primitives (DO NOT MODIFY)
│   │   ├── MasonryGallery.tsx       # Custom — recipe image gallery
│   │   ├── LeafGallery.tsx          # Custom — leaf image gallery
│   │   ├── ImageLightbox.tsx        # Custom — fullscreen image viewer
│   │   ├── MobileDebugPanel.tsx     # Custom — mobile debug overlay
│   │   ├── PWAInstallPrompt.tsx     # Custom — PWA install banner
│   │   └── [shadcn primitives]      # button, card, dialog, toast, chart, etc.
│   ├── effects/                     # Visual effect components
│   └── pdf/                         # PDF generation components
├── contexts/
│   ├── AuthContext.tsx               # Supabase auth provider
│   └── VisualEffectsContext.tsx      # Particles, parallax, glow settings
├── data/
│   ├── recipes.ts                   # 4 static recipes (Msemen, Barley, Omelette, Powder)
│   └── leaves.ts                    # Static leaf data (names, aliases, nutrition)
├── hooks/
│   ├── useI18n.tsx                  # i18n translations (EN/FR/AR) — 52KB
│   ├── use-mobile.tsx               # Mobile detection hook
│   ├── use-toast.ts                 # Toast hook
│   ├── useMouseTilt.tsx             # Mouse tilt effect
│   ├── useParallax.tsx              # Parallax effect
│   └── useVanillaTilt.tsx           # Vanilla Tilt 3D effect
├── lib/
│   ├── logger.ts                    # { debug, info, warn, error } — dev-only console logger
│   ├── supabaseClient.ts            # Supabase client (placeholder fallback if no env vars)
│   ├── safeStorage.ts               # localStorage wrapper with try/catch
│   ├── utils.ts                     # cn() utility (clsx + tailwind-merge)
│   └── performance.ts               # Performance monitoring
├── services/
│   ├── apiService.ts                # APIService class — chat, detection, localStorage CRUD
│   ├── analyticsService.ts          # AnalyticsService — scan/chat/recipe trends
│   ├── analyticsEventService.ts     # Analytics.track* event helpers
│   ├── impactService.ts             # ImpactService — CO2, money, polyphenol calculations
│   └── settingsService.ts           # SettingsService — API keys, endpoints, provider config
├── types/                           # TypeScript type declarations
└── utils/
    ├── chromeCompatibility.ts       # Chrome feature detection & issue reporting
    ├── imageCompression.ts          # Client-side image compression
    ├── pwaUtils.ts                  # Service worker registration
    └── remoteErrorLogger.ts         # Remote error logging (localStorage-based)
```

---

## 4. Navigation Architecture — CRITICAL

The app uses a **single-page tab system**, NOT React Router for public pages.

### How It Works

1. `PublicApp.tsx` manages `activeTab` state: `"home" | "chat" | "stats" | "recipes" | "leaves" | "settings"`
2. `renderCurrentPage` (a `useMemo`) switches on `activeTab` and renders the corresponding page component
3. Navigation between pages happens via:
   - `onTabChange` prop passed to `AppLayout` → bottom FAB / top menu buttons
   - `window.dispatchEvent(new CustomEvent('navigateToRecipe', { detail: { recipeId } }))` — from ChatPage
   - `window.dispatchEvent(new CustomEvent('navigateToLeaf', { detail: { leafId } }))` — from ChatPage
   - `window.dispatchEvent(new Event('toggleTheme'))` — from AppLayout
   - `window.dispatchEvent(new Event('openCameraScan'))` — from LandingPage

### Recipe Navigation Flow (from Chat → RecipePage)

```
ChatPage.navigateToRecipe(title)
  → finds recipe in static data (src/data/recipes.ts)
  → dispatches CustomEvent('navigateToRecipe', { detail: { recipeId: recipe.id } })

PublicApp.handleNavigateToRecipe(event)
  → setSelectedRecipeId(event.detail.recipeId)
  → setActiveTab("recipes")

RecipePage receives selectedRecipeId prop
  → Synchronous useEffect: immediately sets selectedRecipe from static data
  → Async useEffect: fetches from Supabase, enhances if data found
```

> **RULE**: When navigating to a specific recipe/leaf, ALWAYS set the item synchronously
> from static data (`src/data/recipes.ts` or `src/data/leaves.ts`) BEFORE any async fetch.
> The async Supabase fetch may hang if env vars are missing (placeholder config).

---

## 5. Data Flow — Where State Lives

### All public-page state lives in `PublicApp.tsx`:
- `activeTab` — current page
- `selectedRecipeId` — recipe to show (set by chat navigation)
- `selectedLeafId` — leaf to show (set by chat navigation)
- `theme` — light/dark

### localStorage Keys (via `APIService`)
All keys are prefixed with `safeleafkitchen_`. Key examples:
- `safeleafkitchen_detected_leaves` — array of `{ timestamp, leaves: DetectionResult[] }`
- `safeleafkitchen_recipe_views` — array of `{ id, timestamp }`
- `safeleafkitchen_favorite_recipes` — array of `{ id, timestamp }`
- `safeleafkitchen_conversation_<id>` — saved chat conversations
- `safeleafkitchen_conversation_list` — conversation index
- `safeleafkitchen_current_conversation` — active conversation ID
- `scans` — total scan count (plain number)
- `chats` — total chat count (plain number)

### Supabase Tables
- `recipes` — CRUD via admin, fetched by RecipePage
- `leaves` — CRUD via admin, used for RAG context
- Auth for admin login

---

## 6. The Logger — ALWAYS IMPORT IT

The app uses a custom logger at `src/lib/logger.ts`:
```ts
import { logger } from '@/lib/logger';
```

**CRITICAL RULE**: If a component uses `logger.debug()`, `logger.warn()`, or `logger.error()`,
it MUST have this import at the top. Failure to import causes a `ReferenceError` that crashes
the entire component via ErrorBoundary.

Files that currently use logger:
- `ChatPage.tsx` ✅ (has import)
- `RecipePage.tsx` ✅ (has import)
- `StatsPage.tsx` ✅ (has import — was previously missing, fixed)
- `LandingPage.tsx` — uses logger via `useI18n` hook
- `apiService.ts` ✅ (has import)
- `analyticsService.ts` — check before adding logger calls
- `impactService.ts` — check before adding logger calls

---

## 7. Recipe Data — Source of Truth

### Static Recipes (`src/data/recipes.ts`)
4 recipes with **numeric** IDs: 1, 2, 3, 4
```ts
export interface Recipe {
  id: number;
  title: { fr: string; en: string; ar: string };
  ingredients: { fr: string[]; en: string[]; ar: string[] };
  steps: { fr: string[]; en: string[]; ar: string[] };
  nutrition: {
    proteins_g: number; fats_g: number; ash_g: number;
    moisture_percent: number; polyphenols_mg: number;
    flavonoids_mg: number; antioxidant_score: string;
  };
  image_url?: string;
  gallery_images?: string[];
}
```

### Supabase Recipes
May have different ID types (UUIDs). Always fallback to static data if Supabase fails.

### Recipe Titles (exact, used for chatbot matching)
1. "Stuffed Msemen with Onion Leaves"
2. "Barley Flatbread with Onion Leaves"
3. "Omelette with Onion Leaves"
4. "Powdered Dried Onion Leaves"

The chatbot's system prompt tells the LLM to respond with ONLY exact recipe titles.
`ChatPage.tsx` then matches the response against `recipeTitles` to set `suggestedRecipe`.

---

## 8. ChatPage — The Largest Component (2100+ lines)

`ChatPage.tsx` is ~90KB. Most of that is nutritional JSON data embedded in the system prompt.
When modifying ChatPage:

1. The system prompt (lines ~300-1540) contains inline nutritional data for 9 leaf types
2. `sendMessage()` (line ~288) handles user input → API call → response matching
3. Recipe matching logic (line ~1560): compares bot response against `recipeTitles` array
4. `navigateToRecipe()` (line ~45): dispatches CustomEvent to PublicApp
5. `handleCameraDetection()` (line ~1645): processes Roboflow results
6. Message rendering (line ~1942): renders chat bubbles + recipe/leaf suggestion buttons

**DO NOT** rewrite the system prompt nutritional data or move it to a separate file
without explicit user approval — it is intentionally embedded for the LLM context window.

---

## 9. StatsPage — Dashboard

Loads data from:
- `APIService.getDetectedLeaves()` — leaf scan history
- `APIService.getScans()` / `.getChats()` — counters
- `ImpactService.getCumulativeImpact()` — aggregated impact metrics
- `AnalyticsService.getScanTrend()` / `.getChatTrend()` / `.getWeeklyStatsRange()` — chart data
- `recipes` static data — nutritional averages

Uses Recharts for 4 chart panels (Line, Area, Bar, multi-Line).

---

## 10. Styling Conventions

### CSS Class Patterns
- `glass` — glassmorphism card base (defined in `index.css`)
- `bg-gradient-primary` / `bg-gradient-hero` / `bg-gradient-organic` / `bg-gradient-glow` — gradient presets
- `btn-organic` — styled button with gradient
- `shadow-glow` — glowing shadow effect
- `animate-leaf-float` / `animate-wobble` — custom keyframe animations

### Tailwind Config
Custom colors defined in `tailwind.config.ts`:
- `primary`, `secondary`, `accent`, `muted`, `destructive` — HSL-based
- Dark mode via `.dark` class on `<html>`

### Rules
- Use `cn()` from `@/lib/utils` for conditional class merging (not string concatenation)
- Use `text-foreground`, `text-muted-foreground`, `bg-background` — not raw colors
- Use responsive `sm:` / `md:` / `lg:` / `xl:` prefixes for mobile-first design

---

## 11. Known Pitfalls — READ BEFORE CODING

### ❌ Missing Imports
Every file that uses `logger` MUST import it. Past bug: `StatsPage.tsx` used `logger.debug()`
without importing → `ReferenceError: logger is not defined` → entire page crash.

### ❌ Async-Only Recipe Selection
Past bug: `RecipePage` only set `selectedRecipe` inside an async Supabase fetch.
With placeholder Supabase config (no env vars), the fetch hangs indefinitely,
so `selectedRecipe` stays `null`, rendering the empty "Favorite Recipes" fallback.
Fix: Always set recipe synchronously from static data FIRST.

### ❌ Supabase Placeholder Config
`supabaseClient.ts` uses `https://placeholder-project.supabase.co` when env vars are missing.
This means ALL Supabase queries will fail. Always handle errors and fallback to static data.

### ❌ Recipe ID Type Mismatch
Static recipes use `number` IDs (1, 2, 3, 4). Supabase recipes may use UUID strings.
Always use loose comparison or ensure ID types match when finding recipes.

### ❌ ChatPage System Prompt Size
The system prompt in ChatPage is ~1200 lines of embedded nutritional JSON.
Do NOT accidentally delete or truncate it when editing sendMessage logic.

### ❌ useMemo for Page Rendering
`PublicApp.tsx` uses `useMemo` for `renderCurrentPage`. All state that affects which page
renders (activeTab, selectedRecipeId, selectedLeafId, etc.) MUST be in the dependency array.

### ❌ CustomEvent Listeners
Navigation events use `window.addEventListener`. These are registered in `useEffect` with
cleanup functions. Do NOT duplicate listeners or forget cleanup.

### ❌ i18n Key Errors
`useI18n` logs warnings for missing translation keys. When adding new UI text, add keys
to all 3 languages (EN, FR, AR) in the translations object inside `useI18n.tsx`.

---

## 12. How to Add a New Recipe

1. Add the recipe object to `src/data/recipes.ts` with the next numeric ID
2. Add recipe images to `public/images/recipes/<recipe-name-kebab-case>/1.png`
3. The recipe title (EN) will automatically appear in the chatbot's recipe list
4. If Supabase is configured, also add via admin dashboard at `/admin/recipes`

---

## 13. How to Add a New Page/Tab

1. Create `src/components/pages/NewPage.tsx`
2. Add the tab ID to the union type in `PublicApp.tsx` (line 16)
3. Add a case in `renderCurrentPage` switch (inside `useMemo`)
4. Add the tab to `AppLayout.tsx` tabs array (line 55-61)
5. Add navigation handlers if needed in `PublicApp.tsx`

---

## 14. Environment Variables

Required for full functionality (set in `.env`):
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

API keys are configured at runtime via the Settings page (`SettingsService`):
- Roboflow API key + endpoint (for leaf detection)
- OpenRouter API key + endpoint (for chatbot)
- n8n Webhook URL (alternative chatbot provider)
- Chat provider selection (openrouter vs n8n)

---

## 15. Build & Run

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (default: http://localhost:8080)
npm run build      # Production build
npm run preview    # Preview production build
```

Deployed via Vercel (`vercel.json` configured with SPA rewrites).

---

## 16. Testing Checklist After Changes

After any modification, verify:
- [ ] Stats page loads without crash (no ReferenceError)
- [ ] Chat → "View Recipe" button navigates to the specific recipe (not empty favorites)
- [ ] Chat → "View Leaf" button navigates to the specific leaf profile
- [ ] Recipe sidebar shows all 4 (or more) recipes
- [ ] Dark mode toggle works
- [ ] Language switch (EN/FR/AR) works
- [ ] No console errors in browser DevTools

---

## 17. File Size Warning

These files are LARGE. Do not attempt to rewrite them entirely:
- `ChatPage.tsx` — 2116 lines, 90KB (nutritional data embedded in system prompt)
- `useI18n.tsx` — 52KB (all translations for 3 languages)
- `StatsPage.tsx` — 1062 lines, 47KB
- `LandingPage.tsx` — 52KB
- `RecipePage.tsx` — 800+ lines, 36KB
- `ManageRecipes.tsx` — 34KB (admin)

**Always make surgical edits. Never rewrite entire files.**

---

## 18. Import Path Alias

The project uses `@/` as an alias for `src/`:
```ts
import { logger } from '@/lib/logger';
import { APIService } from '@/services/apiService';
import { recipes } from '@/data/recipes';
```
This is configured in `tsconfig.app.json` and `vite.config.ts`.

---

## 19. Roadmap — Planned Architecture (MCP + Modular Expansion)

> **⚠️ IMPORTANT**: The features below are **PLANNED — NOT YET IMPLEMENTED**.
> Do NOT reference these tables, tools, or modules in code as if they exist.
> This section exists so AI models understand the project's direction when asked
> to build new features.

### 19.1 Target Architecture: AI-Native with MCP Integration

The next major version transitions to a modular AI-native architecture using
**MCP (Model Context Protocol)** for structured, injection-safe tool calls.

#### Planned Tech Stack Additions

| Layer | Current | Planned |
|---|---|---|
| AI Agent | OpenRouter / n8n (raw prompt) | Supabase Edge Functions + MCP tools |
| AI Vision | Roboflow (single model) | YOLOv8 (multi-model: leaf health + logo detection) |
| Maps | None | Mapbox GL JS / Leaflet + PostGIS spatial queries |
| Auth/Backend | Supabase (basic) | Supabase (PostgreSQL + GoTrue + Storage + Edge Functions) |

### 19.2 MCP Tool Definitions (Planned)

The AI Agent will interact with the database through secure **MCP Tools**
to prevent prompt injection and ensure context-aware suggestions.

| Tool Name | Action | Data Source |
|---|---|---|
| `get_local_partners` | Find Coops/Restaurants within X km | `partners` table (PostGIS) |
| `check_availability` | Real-time booking check for restaurants | `bookings` table |
| `get_product_details` | Fetch bio-product info/price for marketplace | `products` table |
| `verify_recipe` | Check if a recipe uses a "Scientific Seal" leaf | `scientific_data` table |

### 19.3 Database Schema Expansion (Planned)

These tables will be added to Supabase alongside the existing `recipes` and `leaves` tables:

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | User metadata, "Leaf Points," membership tier | `user_id`, `points`, `tier` |
| `partners` | Cooperatives & restaurants | `name`, `type`, `location` (PostGIS Point), `bio_certs`, `admin_id` |
| `products` | Bio-products linked to partners | `partner_id`, `price`, `stock`, `affiliate_link` |
| `bookings` | Restaurant reservations | `user_id`, `partner_id`, `status`, `date_time` |
| `scientific_data` | Verified scientific leaf analysis | Referenced by `verify_recipe` MCP tool |

### 19.4 Planned Modular Features

#### A. Partner Directory & Map
- Interactive map view with filter by "Cooperative" or "Restaurant"
- Cross-exposure: Restaurant pages show "Cooperative Suppliers"; Cooperative pages show "Our Chefs"
- Admin-only partner creation (Manual Trust Verification)

#### B. Community Hub
- Social feed with likes, comments, and external sharing (`?ref=` tracking)
- Gamification: Users earn "Leaf Points" for scanning leaves and trying partner recipes

#### C. Smart Marketplace
- Booking system integrated into chatbot feed ("Book a table where this leaf is served")
- Affiliate engine tracking sales of local bio-products to partners and users

### 19.5 Security & Scaling Plan

| Concern | Implementation |
|---|---|
| Data isolation | Row Level Security (RLS) — user/partner sees only their own sensitive data |
| Prompt safety | Structured JSON output for MCP calls to prevent "Chatbot Jailbreaking" |
| Offline support | IndexedDB caching of leaf database for use in rural fields with poor connectivity |
| PWA | Full offline mode with service worker (currently partial via `pwaUtils.ts`) |

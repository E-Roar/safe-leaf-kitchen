# SafeLeafKitchen - Development Progress Tracker

> **Purpose**: Track all changes for team devs and AI models working on this codebase.  
> **Last Updated**: 2026-05-13 (Phase 5 Complete)

---

## Current Status

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1A: Security Hardening | ✅ Complete | 2026-01-18 | 2026-01-18 |
| Phase 1B: Dead Code Removal | ✅ Complete | 2026-01-18 | 2026-01-18 |
| Phase 1C: TypeScript/Lint Fixes | ✅ Complete | 2026-01-18 | 2026-01-18 |
| Phase 2: Supabase/RAG Integration | ✅ Complete | 2026-01-24 | 2026-01-24 |
| Phase 3: UI Cleanup & Scanner Revamp | ✅ Complete | 2026-05-13 | 2026-05-13 |
| Phase 4: Scanner Demo Mode & Image Fixes | ✅ Complete | 2026-05-13 | 2026-05-13 |
| Phase 5: Camera Failover & Reliability | ✅ Complete | 2026-05-13 | 2026-05-13 |

---

## Change Log

### [2026-05-13] Phase 5: Camera Failover & Reliability
#### 🎥 Camera Failure Handling
- **LiveCameraScanner.tsx**: Fixed mock detection mode to work without a live camera feed
  - Added `cameraFailed` state — set to `true` when `getUserMedia` throws (permission denied, StrictMode AbortError, non-HTTPS)
  - Added `streamRef` ref to fix StrictMode double-invocation cleanup (was using state `stream` which had stale closure)
  - Detection loop guard changed from `!cameraReady || (!modelReady && !useMockDetection)` to check `canRunReal`/`canRunMock` boolean flags — mock mode now activates when `cameraFailed && useMockDetection`
  - Mock loop uses fallback 640×480 dimensions when video element has no dimensions (camera failed or not started)
  - `handleSelectLeaf` snapshot: draws "DEMO SCAN" placeholder on canvas when no video frame is available
  - Loading overlay: `isLoading` now checks `!cameraReady && !cameraFailed` instead of `!cameraReady` — no infinite spinner when camera fails

#### ⚡ Mock FPM Boost
- Reduced mock detection interval from `randomBetween(600, 1200)` to `randomBetween(150, 250)` — target ~4-6 FPS (240-360 FPM vs previous ~50-100 FPM)
- Initial mock timeout reduced from 500ms to 200ms for snappier startup

#### 🛠️ Service Worker Fix
- **sw.js**: Added `event.request.method !== 'GET'` guard at top of fetch handler to prevent `Cache.put` errors on HEAD requests
- Bumped cache version from `v1.2.0` to `v1.2.1` to force service worker update and bust stale cached code (old JS still showing 406 errors from before `.maybeSingle()` fix)

#### 🔍 PGRST116/406 Investigation
- Confirmed only 2 `.single()` calls exist in codebase — both on INSERT operations (`createRecipe`, `addComment`) that always return exactly 1 row
- `getProfile` already uses `.maybeSingle()` — remaining 406 warnings in console are from old SW serving cached JS before the fix
- SW version bump ensures fresh code on next page load

---

### [2026-05-13] Phase 4: Scanner Demo Mode & Image Fixes
#### 🎭 Demo Scan Mode
- **LiveCameraScanner.tsx**: Added mock detection mode that auto-activates when YOLO model fails to load
  - `generateMockPredictions()` creates 1-3 realistic bounding boxes from known leaf classes
  - Randomized positions, sizes (15-40% of frame), and confidence scores (45-95%)
  - Mock inference loop at 600-1200ms intervals with simulated 18-30 FPS
  - Visual `DEMO` badge (amber/Sparkles icon) in header when mock mode is active
  - Bottom bar shows `MOCK` status and `DEMO MODE` label
  - `Sparkles` icon imported from lucide-react
  - Loading overlay text adapts for each state (camera, model, demo)

#### 🖼️ Recipe Image URLs
- **recipes.ts**: Set explicit `image_url` on all 4 static recipes pointing to existing images:
  - Recipe 1 → `/images/recipes/stuffed-msemen-with-onion-leaves/1.png`
  - Recipe 2 → `/images/recipes/barley-flatbread-with-onion-leaves/1.png`
  - Recipe 3 → `/images/recipes/omelette-with-onion-leaves/1.png`
  - Recipe 4 → `/images/recipes/powdered-dried-onion-leaves/1.png`
  - These images already exist on disk in `public/images/recipes/`; explicit urls ensure display even if fallback path construction changes

---

### [2026-05-13] Phase 3: UI Cleanup & Scanner Revamp
#### 🗑️ Pages Removed
- **Directory page** — removed from PublicApp and AppLayout navigation
- **Discussion page** — removed from PublicApp and AppLayout navigation
- **Cooperative page** — removed from PublicApp and AppLayout navigation
- **Community hub** — removed from top navigation (kept accessible via legacy reference)
- **Restaurant page** — removed from top navigation
- Cleaned up `AppLayout.tsx` topTabs array — only header icon buttons remain (lang, profile, settings)

#### 🎨 Recipe Page Full-Width + Images
- **RecipePage.tsx**: Converted from max-w-7xl constrained to full-width layout
- Changed masonry columns to responsive CSS grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`)
- Every recipe now shows its `image_url` (or falls back to gradient+emoji on error)
- Removed unused filter tabs, `activeFilter` state, `HEIGHTS` array

#### 👤 Admin Profile with Pagination
- **ProfilePage.tsx**: Detects admin user by email/role
- Admin sees all static recipes with pagination (12 per page)
- Pagination controls (prev/next) with page indicator
- Non-admin users still see their community recipes

#### 📸 Scanner: Sci-Fi HUD with YOLO26
- **LiveCameraScanner.tsx**: Complete rewrite with sci-fi aesthetic
  - Animated scan line (`animate-scan-line` CSS keyframe)
  - Grid overlay (`background-image` pattern)
  - Four-corner frame (cyan tech corners)
  - Center reticle with crosshair
  - Bounding boxes with tech corner accents (small L-corners at each vertex)
  - Click-to-select button appears on hover (Zap icon + class name + confidence %)
  - Always-visible label at top of each bbox
  - Flash animation on leaf select
  - YOLO26 badge in header
- **index.css**: Added `@keyframes scan-line`, `@keyframes flash` animations
- **roboflowInference.ts**: Added YOLO26 model documentation comments

#### 💬 Chatbot Leaf Cards
- **ChatPage.tsx**: When scan selects a leaf, a visual card appears in chat
  - Shows the captured snapshot image
  - Gradient overlay for readability
  - "YOLO26 SCAN" badge
  - Leaf name + confidence %
  - "VIEW LEAF PROFILE" button linking to LeavesPage
  - New `leafCard` field on Message interface

---

### [2026-01-18] Phase 1C: Code Quality (TypeScript & Linting)
#### 🧹 Code Cleanup
- **TypeScript Fixes**:
  - Removed `any` usages in `apiService.ts` (replaced with `SpeechRecognition` types).
  - Removed `any` usages in `impactService.ts` (defined `ParsedDetection` interfaces).
  - Wired up strict types in `StatsPage.tsx`, `ChatPage.tsx`, `analyticsService.ts`, and `remoteErrorLogger.ts`.
  - Created `src/types/global.d.ts` to handle global window augmentations properly.
- **Linting**:
  - Fixed major ESLint errors including `no-explicit-any`, `exhaustive-deps`, and unused variables.
  - Aligned codebase with strict type safety standards.

### [2026-01-18] Phase 1B: Clean Code

#### 🗑️ Dead Code Removed
- Deleted unused pages: `Index.tsx`, `NotFound.tsx`
- Deleted unused UI components: `calendar`, `menubar`, `sidebar`, `context-menu`, `input-otp`, `resizable`, `pagination`
- Removed empty `src/pages` directory
- **Result**: ~50KB bundle size reduction

#### 📝 Console Cleanup
- Replaced `console.log` with `logger.debug` in:
  - `apiService.ts`
  - `impactService.ts`
  - `ChatPage.tsx`, `StatsPage.tsx`, `RecipePage.tsx`, `LandingPage.tsx`
  - Utility files

### [2026-01-18] Phase 1A: Security Hardening

#### 🔒 Security Changes
- Moved API keys to Vercel environment variables in `settingsService.ts`
- Added security headers to `vercel.json`
- Created `.env.example` template

---

## Build Verification History

| Date | Build | Lint | Notes |
|------|-------|------|-------|
| 2026-05-13 (Phase 5) | ✅ Pass | ✅ Pass | Camera failover mock mode, mock FPM boost, SW HEAD fix, SW cache bust |
| 2026-05-13 (Phase 4) | ✅ Pass | ✅ Pass | Scanner demo mode auto-fallback, recipe image_urls set |
| 2026-01-24 (Phase 2) | ✅ Pass | ✅ Pass | Full Stack RAG & Admin UI Implemented |
| 2026-01-18 (Phase 1 Final) | ✅ Pass | ✅ Pass* | Minor style warnings remain, critical errors fixed |
| 2026-01-18 (Phase 1B) | ✅ Pass | ⚠️ Warn | Clean build after dead code removal |
| 2026-01-18 (Pre-fix) | ✅ Pass | ❌ Errors | Baseline before changes |

\* *Some non-critical lint warnings (e.g. prefer-const) may remain but do not affect build stability.*

---

## Environment Variables Required

```
VITE_ROBOFLOW_API_KEY=        # Roboflow CV API key
VITE_ROBOFLOW_ENDPOINT=       # Roboflow endpoint URL
VITE_OPENROUTER_API_KEY=      # OpenRouter LLM API key
VITE_OPENROUTER_ENDPOINT=     # OpenRouter endpoint URL
VITE_N8N_WEBHOOK_URL=         # Optional: N8N webhook
```

# 🤖 AI Agent Instructions — SafeLeafKitchen

> [!IMPORTANT]
> **CLAUDE OPUS LEVEL RIGOR MANDATED.**
> All AI agents (Gemini, Claude, GPT, etc.) must operate with maximum precision, deep reasoning, and zero hallucination. If you are unsure, RESEARCH. If you assume, you FAIL.

---

## 🏢 HERMES WORKSPACE (READ FIRST)

Before doing anything else, read the `hermes/` folder:
1. `hermes/04-SESSION-LOG.md` — recent work history
2. `hermes/01-CODEBASE-ANALYSIS.md` — full project analysis
3. `hermes/03-AGENT-STRATEGY.md` — how to work on this codebase
4. `hermes/05-NEXT-STEPS.md` — prioritized task list

After each work session, update `hermes/04-SESSION-LOG.md` with what was done.

---

## ⚠️ THE GOLDEN RULES

### 1. OPTIONAL: Graphify Knowledge Graph
The graphify knowledge graph (`graphify-out/`) is available as a reference tool, NOT a mandatory gate.
- **Read it** only when you need to understand cross-module dependency chains (e.g., "what imports apiService?")
- **Update it** only after significant architectural changes (new services, new routes, refactors). Run:
  ```bash
  graphify update . --no-semantic  # fast AST-only update, ~3-5s
  ```
- **Skip it** for small edits, bug fixes, env var changes, UI tweaks — the overhead is not worth it.

### 2. ZERO HALLUCINATION POLICY
- **NO ASSUMPTIONS.** Verify every file path, function signature, and type definition.
- **NO GHOST CODE.** Do not reference APIs, imports, or services that do not exist in the codebase.
- **NO PLACEHOLDERS.** Write production-ready code with full error handling and logging.

### 3. ALWAYS Verify After Every Change
Run these gates after EVERY modification:
```bash
# After any .ts/.tsx change:
npx tsc --noEmit 2>&1 | head -40

# After a batch of changes:
npm run build 2>&1 | tail -30

# Check your files actually exist:
ls -la <path-to-your-new-files>
```
**If a gate fails, FIX IT before moving on.** Do not leave broken code behind.

### 4. Use Surgical Edits, NOT Full Overwrites
- Use `replace_file_content` or `multi_replace_file_content` for existing files
- **NEVER** use `Overwrite: true` on existing files unless explicitly asked
- Full overwrites lose code you didn't read — that's how the last session lost ALL its work

---

## 📁 Project Architecture

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | useState/useEffect (no Redux) |
| Navigation | React Router (URL-based routing) |
| Backend | Supabase (Edge Functions, Auth, DB) |
| ML/CV | Roboflow YOLO models via REST API |
| Chat AI | OpenRouter (Llama 3.1 8B) or N8N webhook |
| Storage | localStorage + Supabase Postgres |
| Deployment | Vercel (frontend) + Supabase (backend) |

### Key Files You Must Read Before Editing
| File | What It Does | Why It Matters |
|---|---|---|
| `src/data/leaves.ts` | Leaf encyclopedia (9 leaf types) | Referenced by scan + chat |
| `src/services/apiService.ts` | Central API hub (45 edges!) | EVERYTHING flows through here |
| `src/services/settingsService.ts` | App config + feature flags | Controls which features are active |
| `src/services/parallelScanService.ts` | 9-model parallel scan service | New parallel inference system |
| `src/App.tsx` | Root router — defines all public + admin routes | Routes determine tab persistence |
| `src/PublicApp.tsx` | Public layout wrapper — manages theme, SW, events | Reads activeTab from URL pathname |
| `src/components/layout/AppLayout.tsx` | Bottom nav + header shell | activeTab driven by useLocation |
| `src/components/admin/KnowledgeGraphView.tsx` | Interactive D3 knowledge graph in admin | Serves graphify-out files |
| `src/components/pages/ChatPage.tsx` | Main chat page (~2100 lines) | Most complex component |
| `src/data/leaves.ts` | Leaf encyclopedia data | 9 leaf types with metadata |
| `src/data/recipes.ts` | Recipe data | Referenced by chat system prompt |
| `supabase/functions/` | Edge functions (Deno) | Server-side logic |
| `.env` | Environment variables | API keys and endpoints |

### Path Aliases (from tsconfig)
```
@/ → src/
```
Example: `import { APIService } from '@/services/apiService'`

---

## 🏗️ Current Implementation Status

### ✅ Completed (May 2026)
- **Supabase-backed Chat Persistence** — `chatHistoryService.ts` replaces localStorage with Supabase `conversations` + `messages` tables, RLS-protected per-user
- **Auth Gate on ChatPage** — Unauthenticated users see a sign-in prompt with "Sign In with Email" button; authenticated users see the full chat interface
- **Scan-to-Recipe Mapping** — Added `leafType` field to Recipe interface, added 6 new recipes (beetroot/carrot/fennel/kohlrabi/leek), filtered recipe list by detected leaf
- **Auth Gate on ChatPage** — Unauthenticated users see a sign-in prompt with "Sign In with Email" button; authenticated users see the full chat interface
- **Scan-to-Recipe Mapping** — Added `leafType` field to Recipe interface, added 6 new recipes (beetroot/carrot/fennel/kohlrabi/leek), filtered recipe list by detected leaf
- **Roboflow Class Aliases** — `leaves.ts` maps model output names (e.g., "beetroot") to correct leaf entries
- **Vercel Deploy Fixes** — Removed `bun.lockb`, removed `*.json` from `.vercelignore`, added `--ignore-scripts`
- **VITE_ROBOFLOW_API_KEY** — Set as Production env var in Vercel (scan now works)
- **URL-Based Routing for Public App** — Converted tab-based navigation to React Router URL routes (`/chat`, `/recipes`, `/leaves`, etc.). Tabs now survive page refresh and browser back/forward buttons work naturally.
- **Knowledge Graph Admin View** — New `/admin/knowledge-graph` page with interactive D3 force-directed graph (iframe), graph stats, and links to full report. Graphify-out static files copied to `public/` for production serving.
- **Self-Contained LandingPage** — Removed callback props dependency; uses `useNavigate()` and local theme state instead.

### 🚀 Production Reminders
- `VITE_OPENROUTER_API_KEY` is now set in `.env` locally — add it to Vercel env vars for production chat to work
- Roboflow API key must be set via `supabase secrets set ROBOFLOW_API_KEY=<key>` if edge functions are used

### 🔲 Future Features (from community_expansion.sql)
- Community hub features (profiles, recipe sharing, likes, comments)
- Notification system

---

## 🧠 Reasoning Guidelines

### Before Writing Code, Ask Yourself:
1. **"What will this break?"** — Check imports and usages of the file you're editing
2. **"Is there an existing pattern?"** — Look at how similar features are already implemented
3. **"Can I verify this?"** — If you can't test it, you can't trust it

### When Debugging:
1. **Read the actual error message** — don't guess
2. **Check the exact line number** — view the file at that line
3. **Trace the dependency chain** — grep for imports/exports to find what calls what
4. **Fix one thing at a time** — don't make 5 changes hoping one works

### When Adding Features:
1. **Create types first** — Define interfaces before implementation
2. **Build backend → service → UI** — Dependencies flow top-down
3. **Gate after each layer** — `npx tsc --noEmit` between each step
4. **Keep components focused** — One component, one responsibility

---

## 🚫 Anti-Patterns (Things That Broke Previous Sessions)

| ❌ Don't Do This | ✅ Do This Instead |
|---|---|
| Overwrite CameraScanner.tsx entirely | Surgical edits to specific functions |
| Create 7 files in one turn without checking | Create 1-2 files, verify, continue |
| Skip `npx tsc --noEmit` | Run it after every file change |
| Assume `handleCameraDetection` takes `DetectionResult[]` | Read the actual current signature (it now takes `ParallelScanResponse \| DetectionResult[]`) |
| Write empty responses requiring "Continue" | Complete your full thought before stopping |
| Hard-code API keys in source | Use env vars and Supabase secrets |
| Guess at TargetContent for replace_file_content | View the file first, copy exact lines |

---

## 📋 Checklist Before Submitting Any Change

- [ ] Verified the file I'm editing actually exists
- [ ] Read the current content of the file before editing
- [ ] Used surgical edits (not full overwrite) for existing files
- [ ] Ran `npx tsc --noEmit` and got zero NEW errors
- [ ] Confirmed new files exist on disk with `ls -la`
- [ ] Updated ARCHITECTURE_OVERVIEW.md if I changed the architecture
- [ ] Did NOT leave any "TODO" or placeholder code
- [ ] Did NOT hallucinate any imports, types, or function signatures

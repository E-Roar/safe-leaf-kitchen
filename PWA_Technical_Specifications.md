
# Technical Specifications: Safe Leaf Kitchen PWA
## Modular AI-Native Architecture with MCP Integration

### 1. Core Tech Stack
* **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons.
* **Backend/Auth:** Supabase (PostgreSQL + GoTrue + Storage).
* **AI Vision:** YOLOv8 (hosted on Roboflow or custom Inference API) for leaf health & logo detection.
* **AI Agent:** OpenAI/Anthropic via Supabase Edge Functions with **MCP (Model Context Protocol)**.
* **Maps:** Mapbox GL JS / Leaflet with PostGIS for spatial queries.

### 2. System Architecture & MCP Tools
The AI Agent interacts with the database through secure **Tools (MCP)** to prevent injection and ensure context-aware suggestions.

| Tool Name | Action | Data Source |
| :--- | :--- | :--- |
| `get_local_partners` | Find Coops/Restaurants within X km. | `partners` table (PostGIS) |
| `check_availability` | Real-time booking check for restaurants. | `bookings` table |
| `get_product_details` | Fetch bio-product info/price for marketplace. | `products` table |
| `verify_recipe` | Check if a recipe uses a "Scientific Seal" leaf. | `scientific_data` table |

### 3. Database Schema (Supabase)
* **`profiles`**: User metadata, "Leaf Points," membership tier.
* **`partners`**: Name, type, location (Point), bio-certs, admin_id.
* **`products`**: Linked to partner_id, price, stock, affiliate_link.
* **`recipes`**: Community-submitted, linked to required ingredients/partners.
* **`bookings`**: `user_id`, `partner_id`, `status`, `date_time`.

### 4. Modular Features
#### A. Partner Directory & Map
* **Interactive View:** Filter by "Cooperative" or "Restaurant."
* **Cross-Exposure:** Restaurant pages show their "Cooperative Suppliers." Cooperative pages show "Our Chefs."
* **Admin Control:** Only Admin creates partner accounts (Manual Trust Verification).

#### B. Community Hub
* **Social Feed:** Likes, comments, and external sharing with `?ref=` tracking.
* **Gamification:** Users earn points for scanning leaves and trying partner recipes.

#### C. Smart Marketplace
* **Booking System:** Integrated into Chatbot feed. "Book a table where this leaf is served."
* **Affiliate Engine:** Tracking sales of local bio-products to partners and users.

### 5. Security & Scaling
* **Row Level Security (RLS):** Ensures a user/partner only sees their own sensitive data.
* **Prompt Guardrails:** Structured JSON output for MCP calls to prevent "Chatbot Jailbreaking."
* **PWA Offline Mode:** Caching the leaf database (indexedDB) for use in rural fields with poor connectivity.

# 🏗️ SafeLeafKitchen Architecture Overview

## 📱 Application Type
**Single Page Application (SPA)** built with:
- ⚛️ React 18.3.1
- ⚡ Vite 7.1.5
- 🎨 TypeScript
- 🎯 Client-side routing (no React Router, custom tab navigation)

---

## 🗂️ Project Structure

```
safe-leaf-kitchen/
├── public/               # Static assets
│   ├── icons/           # PWA icons
│   ├── images/          # App images
│   ├── videos/          # Tutorial videos
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
├── src/
│   ├── components/     # React components
│   │   ├── layout/     # Layout components
│   │   ├── pages/      # Page components
│   │   └── ui/         # UI components (shadcn/ui)
│   ├── contexts/       # React contexts
│   ├── data/           # Static data (recipes, leaves)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (logger, storage)
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── vercel.json         # Vercel configuration ⭐ FIXED
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

---

## 🔌 External Dependencies

### 1. **Roboflow API** (Leaf Detection)
- **Purpose:** Computer vision for leaf identification
- **Endpoint:** `https://serverless.roboflow.com/vegetable-detection-rtnua-ymjxz/1`
- **Method:** POST with base64 image
- **Used in:** `src/services/apiService.ts`

### 2. **OpenRouter API** (AI Chat)
- **Purpose:** LLM-powered chat functionality
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Model:** `meta-llama/llama-3.1-8b-instruct`
- **Used in:** `src/services/apiService.ts`

### 3. **N8N Webhook** (Alternative Chat - Optional)
- **Purpose:** Alternative chat backend via workflow automation
- **Configurable:** Via settings
- **Used in:** `src/services/apiService.ts`

### 4. **No Database** ❌
- ✅ All data stored in **localStorage**
- ✅ No Supabase
- ✅ No Firebase
- ✅ No external database

---

## 🎯 Key Features

### 1. **Tab-Based Navigation**
Located in `src/App.tsx`:
- Home (Landing Page)
- Chat (AI Assistant)
- Stats (Analytics)
- Recipes (Recipe Browser)
- Leaves (Leaf Encyclopedia)
- Settings (Configuration)

### 2. **PWA Support**
- Service worker: `public/sw.js`
- Manifest: `public/manifest.json`
- Offline capabilities
- Install prompt

### 3. **Data Storage**
All in `localStorage`:
- User preferences (theme, settings)
- Conversation history
- Scan history
- Recipe favorites
- Analytics data

### 4. **API Integration**
Via `src/services/apiService.ts`:
- Leaf detection (Roboflow)
- Chat responses (OpenRouter/N8N)
- Text-to-speech
- Speech recognition

---

## 🔐 Configuration Management

### Current Setup: `src/services/settingsService.ts`
```typescript
const DEFAULTS = {
  roboflowApiKey: "qhQqXopubSFgUgSVLN0C",
  roboflowEndpoint: "https://serverless.roboflow.com/...",
  openrouterApiKey: "sk-or-v1-...",
  openrouterEndpoint: "https://openrouter.ai/api/v1/...",
  n8nWebhookUrl: "",
  chatProvider: 'openrouter'
};
```

### Environment Variables (Optional)
Can override defaults with:
- `VITE_ROBOFLOW_API_KEY`
- `VITE_ROBOFLOW_ENDPOINT`
- `VITE_OPENROUTER_API_KEY`
- `VITE_OPENROUTER_ENDPOINT`
- `VITE_N8N_WEBHOOK_URL`

---

## 🚀 Build Process

### Development
```bash
npm run dev
# Runs on http://localhost:8080
```

### Production Build
```bash
npm run build
# Output: dist/ folder
```

### Preview Build
```bash
npm run preview
# Tests production build locally
```

---

## 🌐 Vercel Deployment

### Build Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### What Happens During Deployment:
1. ✅ Install dependencies (`npm install`)
2. ✅ Build app (`npm run build`)
3. ✅ Generate `dist/` folder
4. ✅ Deploy to Vercel CDN
5. ✅ Route all requests to `index.html` (SPA behavior)

---

## 📊 Analytics & Logging

### Local Analytics
`src/services/analyticsService.ts`:
- Tracks scans, chats, recipe views
- Stored in localStorage
- No external analytics service

### Error Logging
`src/utils/remoteErrorLogger.ts`:
- Logs to browser console
- Could be extended to use Sentry/LogRocket
- Currently client-side only

### Logger
`src/lib/logger.ts`:
- Console logging with levels
- Debug, info, warn, error
- Development & production modes

---

## 🎨 Styling

### Tech Stack
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **CSS Variables** - Dark/light theme
- **Responsive** - Mobile-first design

### Theme System
Located in `src/App.tsx`:
- Light/Dark mode toggle
- Persisted in localStorage
- CSS class switching on `<html>`

---

## 🔒 Security Considerations

### Current Status
⚠️ **API keys exposed in source code**

### Recommendations
1. Move keys to Vercel environment variables
2. Rotate keys if production credentials
3. Implement API key restrictions
4. Consider backend proxy for sensitive operations
5. Add rate limiting

---

## 🧪 Testing Checklist

### After Deployment:
- [ ] Landing page loads
- [ ] Tab navigation works
- [ ] Camera/scan functionality
- [ ] Chat responses working
- [ ] Recipe viewing
- [ ] Leaf encyclopedia
- [ ] Settings persistence
- [ ] Theme switching
- [ ] PWA install prompt
- [ ] Offline functionality

---

## 📝 Notes

### No React Router
App uses custom tab-based navigation instead of React Router. All "routing" is handled via state in `App.tsx`.

### No Backend
Fully client-side application. All data processing happens in the browser.

### API Dependencies
App requires external API access to:
- Roboflow (leaf detection)
- OpenRouter (chat)

If these APIs are down, affected features won't work.

---

## 🔮 Future Enhancements

Potential improvements:
1. Add React Router for true URL routing
2. Implement backend API proxy
3. Add user authentication
4. Cloud sync for data
5. Enhanced offline capabilities
6. Social sharing features
7. Recipe submission system
8. Community features

---

**Last Updated:** January 2025  
**Version:** 0.0.0  
**Status:** ✅ Production Ready

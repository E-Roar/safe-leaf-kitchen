# SafeLeafKitchen - AI-Powered Leaf Detection & Nutrition Assistant

SafeLeafKitchen is an intelligent web application that helps users identify edible leaves and provides comprehensive nutritional information, cooking suggestions, and safety considerations. The app uses AI-powered image recognition and natural language processing to deliver personalized assistance for cooking with fresh, healthy ingredients.

> [!IMPORTANT]
> **CONTRIBUTING AGENTS:** You MUST read [AGENT_INSTRUCTIONS.md](file:///home/glitcher/Codebases/safe-leaf-kitchen/AGENT_INSTRUCTIONS.md) and [graphify-out/GRAPH_REPORT.md](file:///home/glitcher/Codebases/safe-leaf-kitchen/graphify-out/GRAPH_REPORT.md) before making any changes. Zero hallucination and graph-first reasoning are mandated.

## Features

- **🌿 Leaf Detection**: AI-powered camera scanning to identify various types of leaves
- **🍽️ Nutrition Assistant**: Detailed nutritional information and health benefits
- **👨‍🍳 Recipe Suggestions**: Cooking tips and creative recipe ideas
- **🎤 Voice Interaction**: Text-to-speech and speech-to-text capabilities
- **📊 Usage Statistics**: Track your scanning and chat history
- **🎨 Modern UI**: Beautiful, nature-inspired dark theme

## Environment Configuration

The application uses environment variables for API configuration. Create a `.env` file in the root directory with the following variables:

```env
# OpenRouter Configuration
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_ENDPOINT=https://openrouter.ai/api/v1/chat/completions

# Roboflow Configuration
VITE_ROBOFLOW_API_KEY=your_roboflow_api_key_here
VITE_ROBOFLOW_ENDPOINT=https://serverless.roboflow.com/leaves-hds6k/1

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Recent Updates

### 🚀 Parallel 9-Model Scanning
- Replaced single-model detection with a parallel ensemble of 9 specialist models.
- Implemented via Supabase Edge Functions for high-concurrency inference.
- Added deterministic tie-breaking and ranking algorithm.

### 🎨 New Color Palette
- Updated to a nature-inspired green theme
- Vibrant primary green colors (HSL: 142 76% 36%)
- Sage green accent colors
- Forest-inspired dark backgrounds

### 🔇 Enhanced TTS Controls
- Global mute/unmute button in the chat header
- Individual message speak buttons show muted state
- Improved visual feedback for TTS status
- Automatic speech cancellation when muted

## How can I edit this code?

Follow the [AGENT_INSTRUCTIONS.md](file:///home/glitcher/Codebases/safe-leaf-kitchen/AGENT_INSTRUCTIONS.md) for local development and contributions.

## What technologies are used for this project?

This project is built with:
- Vite, TypeScript, React
- shadcn-ui, Tailwind CSS
- Supabase (Backend, Auth, Edge Functions)
- Roboflow (YOLO ML Models)

## How can I deploy this project?

- **Frontend**: Vercel
- **Backend**: Supabase (`supabase functions deploy`)
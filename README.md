# SafeLeafKitchen - AI-Powered Leaf Detection & Nutrition Assistant

## Project Overview

SafeLeafKitchen is an intelligent web application that helps users identify edible leaves and provides comprehensive nutritional information, cooking suggestions, and safety considerations. The app uses AI-powered image recognition and natural language processing to deliver personalized assistance for cooking with fresh, healthy ingredients.

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
```

## Recent Updates

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

### ⚙️ Environment-Based Configuration
- API endpoints and keys now configurable via .env file
- Fallback to default values if environment variables are not set
- Improved security and deployment flexibility

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/71344359-082d-4901-a8c2-8534ce3cb835) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/71344359-082d-4901-a8c2-8534ce3cb835) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

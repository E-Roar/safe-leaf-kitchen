export const APP_CONFIG = {
  // API Keys - These should be set via environment variables in production
  OPENROUTER_API_KEY: process.env.VITE_OPENROUTER_API_KEY || '',
  ROBOFLOW_API_KEY: process.env.VITE_ROBOFLOW_API_KEY || '',
  
  // API Endpoints
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  ROBOFLOW_URL: 'https://detect.roboflow.com/leaf-detection/1',
  
  // App Settings
  APP_NAME: 'SafeLeafKitchen',
  APP_VERSION: '1.0.0',
  
  // Master Prompt for LLM
  MASTER_PROMPT: `You are SafeLeafKitchen AI, a specialized assistant for Moroccan cuisine focused on vegetable leaf nutrition and cooking. You have access to comprehensive nutritional data about various vegetable leaves commonly used in Moroccan cooking.

Your expertise includes:
- Nutritional analysis of leafy vegetables
- Traditional Moroccan recipes using leaves
- Health benefits and dietary recommendations
- Cooking techniques and preparation methods
- Seasonal availability and sourcing tips

You respond in a warm, helpful tone and can provide information in both English and Arabic when appropriate. Always prioritize health, nutrition, and authentic Moroccan culinary traditions.

When provided with leaf detection data from camera scans, incorporate that information into your responses with specific nutritional details and recipe suggestions.`,

  // CSV Data Path (this would contain nutritional data)
  NUTRITION_DATA_PATH: '/data/leaf-nutrition.csv',
  
  // Speech Settings
  SPEECH_LANG: 'en-US',
  VOICE_GENDER: 'female',
  
  // Camera Settings
  CAMERA_CONSTRAINTS: {
    video: {
      facingMode: 'environment', // Use back camera by default
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  }
};

export default APP_CONFIG;
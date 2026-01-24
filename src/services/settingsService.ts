/**
 * Application Settings Service
 * 
 * SECURITY NOTICE: API keys must be configured via environment variables.
 * Never commit API keys to source code.
 * 
 * Required Vercel Environment Variables:
 * - VITE_ROBOFLOW_API_KEY
 * - VITE_ROBOFLOW_ENDPOINT  
 * - VITE_OPENROUTER_API_KEY
 * - VITE_OPENROUTER_ENDPOINT
 * - VITE_N8N_WEBHOOK_URL (optional)
 */

export type AppSettings = {
  roboflowApiKey: string;
  roboflowEndpoint: string;
  openrouterApiKey: string;
  openrouterEndpoint: string;
  n8nWebhookUrl: string;
  chatProvider: 'openrouter' | 'n8n';
};

// Default endpoints (non-sensitive) - API keys must come from env vars
const DEFAULTS: AppSettings = {
  roboflowApiKey: import.meta.env.VITE_ROBOFLOW_API_KEY || "",
  roboflowEndpoint: import.meta.env.VITE_ROBOFLOW_ENDPOINT || "https://serverless.roboflow.com/vegetable-detection-rtnua-ymjxz/1",
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "",
  openrouterEndpoint: import.meta.env.VITE_OPENROUTER_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions",
  n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || "",
  chatProvider: 'openrouter',
};

class SettingsService {
  private static overrides: Partial<AppSettings> = {};

  static getSettings(): AppSettings {
    return { ...DEFAULTS, ...this.overrides } as AppSettings;
  }

  static update(partial: Partial<AppSettings>) {
    this.overrides = { ...this.overrides, ...partial };
  }

  static reset() {
    this.overrides = {};
  }

  static get defaults(): AppSettings {
    return DEFAULTS;
  }

  /**
   * Validates that required API keys are configured.
   * Call this before making API requests.
   */
  static validateConfiguration(): { valid: boolean; missing: string[] } {
    const settings = this.getSettings();
    const missing: string[] = [];

    if (!settings.roboflowApiKey) {
      missing.push('VITE_ROBOFLOW_API_KEY');
    }
    if (!settings.openrouterApiKey && settings.chatProvider === 'openrouter') {
      missing.push('VITE_OPENROUTER_API_KEY');
    }
    if (!settings.n8nWebhookUrl && settings.chatProvider === 'n8n') {
      missing.push('VITE_N8N_WEBHOOK_URL');
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Check if API keys are configured (for UI feedback)
   */
  static isConfigured(): boolean {
    return this.validateConfiguration().valid;
  }
}

export { SettingsService, DEFAULTS };
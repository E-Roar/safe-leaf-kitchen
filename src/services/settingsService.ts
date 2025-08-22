export type AppSettings = {
  roboflowApiKey: string;
  roboflowEndpoint: string;
  openrouterApiKey: string;
  openrouterEndpoint: string;
  n8nWebhookUrl: string;
  chatProvider: 'openrouter' | 'n8n';
};

const DEFAULTS: AppSettings = {
  roboflowApiKey: import.meta.env.VITE_ROBOFLOW_API_KEY || "qhQqXopubSFgUgSVLN0C",
  roboflowEndpoint: import.meta.env.VITE_ROBOFLOW_ENDPOINT || "https://serverless.roboflow.com/vegetable-detection-rtnua-ymjxz/1",
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "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",
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
}

export { SettingsService, DEFAULTS };
export type AppSettings = {
  roboflowApiKey: string;
  roboflowEndpoint: string;
  openrouterApiKey: string;
  openrouterEndpoint: string;
};

const DEFAULTS: AppSettings = {
  roboflowApiKey: import.meta.env.VITE_ROBOFLOW_API_KEY || "qhQqXopubSFgUgSVLN0C",
  roboflowEndpoint: import.meta.env.VITE_ROBOFLOW_ENDPOINT || "https://serverless.roboflow.com/leaves-hds6k/1",
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "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",
  openrouterEndpoint: import.meta.env.VITE_OPENROUTER_ENDPOINT || "https://openrouter.ai/api/v1/chat/completions",
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
export type AppSettings = {
  parallelScanEnabled: boolean;
  parallelScanFallback: boolean;
};

const DEFAULTS: AppSettings = {
  parallelScanEnabled: false,
  parallelScanFallback: false,
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
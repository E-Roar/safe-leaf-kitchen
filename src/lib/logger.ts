export const logger = {
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    if (import.meta.env.PROD) {
      // TODO: Implement error tracking service integration
    }
  }
};

export const isDevelopment = import.meta.env.DEV;

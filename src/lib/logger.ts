export const logger = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error tracking service integration
    }
  }
};

export const isDevelopment = process.env.NODE_ENV === 'development';

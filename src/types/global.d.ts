export { };

declare global {
    interface Window {
        _originalConsole?: Console;
        recharts?: any;
        chrome?: {
            runtime?: {
                onStartup?: any;
            };
        };
        safeLeafDebug?: {
            showLogs: () => void;
            exportLogs: () => void;
            shareDebugUrl: () => void;
            testFeatures: () => Promise<void>;
            getCompatibility: () => any;
        };
    }

    interface Navigator {
        standalone?: boolean;
        deviceMemory?: number;
        connection?: {
            effectiveType?: string;
            saveData?: boolean;
        };
    }
}

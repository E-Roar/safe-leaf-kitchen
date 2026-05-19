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
            clearLogs: () => void;
            shareDebugUrl: () => void;
            testFeatures: () => void;
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

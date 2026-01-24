import { useState } from "react";
import { SettingsService, type AppSettings } from "@/services/settingsService";
import { useI18n } from "@/hooks/useI18n";
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const AdminSettings = () => {
    const { t } = useI18n();
    const currentSettings = SettingsService.getSettings();

    const [settings, setSettings] = useState<AppSettings>(currentSettings);
    const [showApiKeys, setShowApiKeys] = useState(false);

    const handleSave = () => {
        SettingsService.update(settings);
        toast.success(t('settings.saved'));
    };

    const handleReset = () => {
        setSettings(SettingsService.defaults);
        toast.info(t('settings.reset'));
    };

    const handleChange = (field: keyof AppSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-emerald-800">System Configuration</h3>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        {t('settings.reset')}
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 gap-2">
                        <Save className="w-4 h-4" />
                        {t('settings.save')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.apiSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.roboflowApiKey')}</label>
                        <div className="relative">
                            <Input
                                type={showApiKeys ? "text" : "password"}
                                value={settings.roboflowApiKey}
                                onChange={(e) => handleChange('roboflowApiKey', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKeys(!showApiKeys)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground"
                            >
                                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.roboflowEndpoint')}</label>
                        <Input
                            value={settings.roboflowEndpoint}
                            onChange={(e) => handleChange('roboflowEndpoint', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.openrouterApiKey')}</label>
                        <div className="relative">
                            <Input
                                type={showApiKeys ? "text" : "password"}
                                value={settings.openrouterApiKey}
                                onChange={(e) => handleChange('openrouterApiKey', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKeys(!showApiKeys)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground"
                            >
                                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.openrouterEndpoint')}</label>
                        <Input
                            value={settings.openrouterEndpoint}
                            onChange={(e) => handleChange('openrouterEndpoint', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.n8nWebhookUrl')}</label>
                        <Input
                            value={settings.n8nWebhookUrl}
                            onChange={(e) => handleChange('n8nWebhookUrl', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.chatProvider')}</label>
                        <select
                            value={settings.chatProvider}
                            onChange={(e) => handleChange('chatProvider', e.target.value as any)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="openrouter">OpenRouter</option>
                            <option value="n8n">n8n Webhook</option>
                        </select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

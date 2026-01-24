import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-border/50 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Admin Access Required</h1>
          <p className="text-muted-foreground text-sm">
            System settings and content management are now restricted to authorized administrators.
          </p>
        </div>

        <Link to="/admin" className="block w-full">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-medium shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Go to Admin Dashboard
          </Button>
        </Link>

        <div className="pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
}
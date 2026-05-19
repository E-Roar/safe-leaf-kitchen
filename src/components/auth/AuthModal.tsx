import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  X, 
  Mail, 
  Lock, 
  Loader2, 
  Leaf, 
  ArrowRight,
  Github,
  Chrome,
  Send,
  ArrowLeft
} from "lucide-react";

import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Verification email sent!", {
          description: "Please check your inbox and click the link to confirm."
        });
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message?.includes('Email not confirmed')) {
            toast.error("Email not yet verified", {
              description: "Check your inbox for the confirmation link, or sign up again to resend."
            });
            return;
          }
          throw error;
        }
        toast.success("Welcome back!");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address first");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Password reset link sent!", {
        description: "Check your inbox for the reset link."
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-background border border-border w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl relative flex flex-col">
        
        {/* Visual Top Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          {/* Logo & Intro */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 border border-primary/20 rotate-3">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'signin' ? 'Welcome Back' : 'Join the Kitchen'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-[240px]">
              {mode === 'signin' 
                ? 'Sign in to access community recipes and share your own.' 
                : 'Create an account to start contributing traditional knowledge.'}
            </p>
          </div>

          {/* Social Auth (Placeholders) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-2xl hover:bg-muted transition-all text-sm font-medium">
              <Chrome className="w-4 h-4" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 border border-border rounded-2xl hover:bg-muted transition-all text-sm font-medium">
              <Github className="w-4 h-4" /> GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <span className="relative bg-background px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Or with Email</span>
          </div>

          {/* Password Reset Flow */}
          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {resetSent
                    ? "Check your inbox for the reset link."
                    : "Enter your email and we'll send you a reset link."}
                </p>
              </div>

              {!resetSent && (
                <>
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-muted/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </>
              )}

              <button 
                type="button"
                onClick={() => { setShowReset(false); setResetSent(false); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
              {/* Sign In / Sign Up Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-muted/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {mode === 'signup' && (
                  <div className="text-xs text-muted-foreground text-center bg-muted/30 rounded-xl p-3">
                    A confirmation link will be sent to your email.
                  </div>
                )}
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full bg-muted/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {mode === 'signin' && (
                  <div className="text-right">
                    <button 
                      type="button" 
                      onClick={() => setShowReset(true)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch Mode */}
              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button 
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="ml-2 font-bold text-primary hover:underline"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

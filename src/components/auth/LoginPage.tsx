import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Friendly error mapping
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Incorrect email or password.');
                }
                throw error;
            }

            if (data.session) {
                toast.success('Welcome back, Admin!');
                navigate('/admin/dashboard');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in');
            toast.error('Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md border-emerald-100 shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-emerald-900">Admin Access</CardTitle>
                    <CardDescription>
                        Sign in to manage Safe Leaf Kitchen content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@safeleaf.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="focus-visible:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="focus-visible:ring-emerald-500"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all font-semibold h-11"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4 text-xs text-muted-foreground">
                    Restricted Access • Authorized Personnel Only
                </CardFooter>
            </Card>
        </div>
    );
};

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Leaf,
    ChefHat,
    BookOpen,
    Settings,
    LogOut,
    Menu,
    X,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const AdminLayout = () => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
            navigate('/admin/login');
        } catch (error) {
            toast.error('Error signing out');
        }
    };

    const navItems = [
        { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/leaves', label: 'Leaves', icon: Leaf },
        { href: '/admin/recipes', label: 'Recipes', icon: ChefHat },
        { href: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen },
        { href: '/admin/migration', label: 'Data Tools', icon: Database },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 fixed inset-y-0 z-50">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                        SafeLeaf Admin
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
                                    : "hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {user?.email?.substring(0, 2) || 'AD'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                            <p className="text-[10px] text-slate-500">Administrator</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-slate-900"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Mobile Header & Overlay */}
            <div className="lg:hidden fixed top-0 w-full z-40 bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <span className="font-bold flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-500" />
                    Admin Panel
                </span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-30 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <nav className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900 text-slate-300 p-4 pt-20 space-y-2 border-l border-slate-800">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    isActive ? "bg-emerald-600/10 text-emerald-400" : "hover:bg-slate-800"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 w-full mt-8"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 min-h-screen">
                <div className="mt-16 lg:mt-0 p-4 lg:p-8 max-w-7xl mx-auto">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

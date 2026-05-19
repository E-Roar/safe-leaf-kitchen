import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Scan, Leaf, ChefHat, MessageCircle, TrendingUp, Clock, Users, Share2, Flame, RefreshCw } from 'lucide-react';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

interface Stats {
    totalScans: number;
    leafViews: number;
    recipeViews: number;
    chatMessages: number;
    shares: number;
    totalLeaves: number;
    totalRecipes: number;
}

interface DailyData {
    date: string;
    scans: number;
    views: number;
}

interface PopularRecipe {
    recipe_id: number;
    views: number;
}

export const DashboardOverview = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [popularRecipes, setPopularRecipes] = useState<PopularRecipe[]>([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const fetchStats = useCallback(async () => {
        try {
            const { data: events, error } = await supabase
                .from('app_events')
                .select('event_type');

            if (error) throw error;

            const counts = {
                totalScans: 0,
                leafViews: 0,
                recipeViews: 0,
                chatMessages: 0,
                shares: 0,
            };

            events?.forEach((e: any) => {
                switch (e.event_type) {
                    case 'scan': counts.totalScans++; break;
                    case 'leaf_view': counts.leafViews++; break;
                    case 'recipe_view':
                    case 'recipe_use': counts.recipeViews++; break;
                    case 'chat_message': counts.chatMessages++; break;
                    case 'share': counts.shares++; break;
                }
            });

            const { count: leavesCount } = await supabase.from('leaves').select('*', { count: 'exact', head: true });
            const { count: recipesCount } = await supabase.from('recipes').select('*', { count: 'exact', head: true });

            setStats({
                ...counts,
                totalLeaves: leavesCount || 0,
                totalRecipes: recipesCount || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchDailyData = useCallback(async () => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data, error } = await supabase
                .from('app_events')
                .select('event_type, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            const dailyMap: Record<string, { scans: number; views: number }> = {};

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                dailyMap[key] = { scans: 0, views: 0 };
            }

            data?.forEach((e: any) => {
                const day = e.created_at.split('T')[0];
                if (dailyMap[day]) {
                    if (e.event_type === 'scan') dailyMap[day].scans++;
                    else dailyMap[day].views++;
                }
            });

            setDailyData(Object.entries(dailyMap).map(([date, counts]) => ({
                date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
                ...counts,
            })));
        } catch (error) {
            console.error('Error fetching daily data:', error);
        }
    }, []);

    const fetchRecentEvents = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentEvents(data || []);
        } catch (error) {
            console.error('Error fetching recent events:', error);
        }
    }, []);

    const fetchPopularRecipes = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('app_events')
                .select('event_data, created_at')
                .in('event_type', ['recipe_view', 'recipe_use', 'share'])
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) throw error;

            const recipeCounts: Record<number, number> = {};
            data?.forEach((e: any) => {
                const recipeId = e.event_data?.recipe_id;
                if (recipeId) {
                    recipeCounts[recipeId] = (recipeCounts[recipeId] || 0) + 1;
                }
            });

            const sorted = Object.entries(recipeCounts)
                .map(([recipe_id, views]) => ({ recipe_id: Number(recipe_id), views }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 5);

            setPopularRecipes(sorted);
        } catch (error) {
            console.error('Error fetching popular recipes:', error);
        }
    }, []);

    const fetchActiveUsers = useCallback(async () => {
        try {
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { count, error } = await supabase
                .from('app_events')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', fiveMinAgo);

            if (error) throw error;
            setActiveUsers(count || 0);
        } catch (error) {
            console.error('Error fetching active users:', error);
        }
    }, []);

    const refreshAll = useCallback(() => {
        fetchStats();
        fetchDailyData();
        fetchRecentEvents();
        fetchPopularRecipes();
        fetchActiveUsers();
        setLastRefreshed(new Date());
    }, [fetchStats, fetchDailyData, fetchRecentEvents, fetchPopularRecipes, fetchActiveUsers]);

    useEffect(() => {
        refreshAll();

        const interval = setInterval(refreshAll, 30000);

        const channel = supabase
            .channel('app_events_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'app_events' },
                () => {
                    refreshAll();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [refreshAll]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const statCards = [
        { title: 'Total Scans', value: stats?.totalScans || 0, icon: Scan, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'Leaf Views', value: stats?.leafViews || 0, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { title: 'Recipe Views', value: stats?.recipeViews || 0, icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50' },
        { title: 'Chat Messages', value: stats?.chatMessages || 0, icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    const contentCards = [
        { title: 'Total Leaves', value: stats?.totalLeaves || 0, color: 'text-emerald-600' },
        { title: 'Total Recipes', value: stats?.totalRecipes || 0, color: 'text-orange-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500">Real-time app usage analytics</p>
                </div>
                <button
                    onClick={refreshAll}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Refresh now"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* Real-time Status Bar */}
            <Card className="border-emerald-200 bg-emerald-50/50">
                <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700">
                                <span className="text-emerald-600 font-bold">{activeUsers}</span> active in last 5 min
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-slate-600">
                                {stats?.shares || 0} total shares
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Updated {lastRefreshed.toLocaleTimeString()}
                    </span>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Counts */}
            <div className="grid grid-cols-2 gap-4">
                {contentCards.map((stat) => (
                    <Card key={stat.title} className="border-slate-200">
                        <CardContent className="pt-6 text-center">
                            <p className="text-sm text-slate-500">{stat.title}</p>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Weekly Activity Chart */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Weekly Activity
                    </CardTitle>
                    <CardDescription>Scans and views over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                    {dailyData.every(d => d.scans === 0 && d.views === 0) ? (
                        <div className="h-64 flex items-center justify-center">
                            <p className="text-slate-400 text-sm">No activity data yet</p>
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                scans: { label: "Scans", color: "hsl(210, 100%, 50%)" },
                                views: { label: "Views", color: "hsl(150, 60%, 45%)" },
                            }}
                            className="h-64"
                        >
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="scans" fill="var(--color-scans)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Popular Recipes & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Popular Recipes */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            Popular Recipes
                        </CardTitle>
                        <CardDescription>Most viewed and used recipes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {popularRecipes.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 text-sm">No recipe activity yet</p>
                        ) : (
                            <div className="space-y-2">
                                {popularRecipes.map((recipe, idx) => (
                                    <div key={recipe.recipe_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                                                idx === 0 ? "bg-orange-500" : idx === 1 ? "bg-amber-500" : idx === 2 ? "bg-yellow-500" : "bg-slate-400"
                                            )}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-700">Recipe #{recipe.recipe_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">{recipe.views}</span>
                                            <span className="text-[10px] text-slate-400">interactions</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-500" />
                            Live Activity Feed
                        </CardTitle>
                        <CardDescription>Latest app events in real-time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentEvents.length === 0 ? (
                            <p className="text-slate-500 text-center py-4 text-sm">No events recorded yet</p>
                        ) : (
                            <div className="space-y-1 max-h-[320px] overflow-y-auto">
                                {recentEvents.map((event) => (
                                    <div key={event.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                {event.event_type === 'scan' && <Scan className="w-3.5 h-3.5 text-blue-500" />}
                                                {event.event_type === 'leaf_view' && <Leaf className="w-3.5 h-3.5 text-emerald-500" />}
                                                {event.event_type === 'share' && <Share2 className="w-3.5 h-3.5 text-blue-500" />}
                                                {(event.event_type === 'recipe_view' || event.event_type === 'recipe_use') && <ChefHat className="w-3.5 h-3.5 text-orange-500" />}
                                                {event.event_type === 'chat_message' && <MessageCircle className="w-3.5 h-3.5 text-purple-500" />}
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-slate-700 capitalize">
                                                    {event.event_type.replace(/_/g, ' ')}
                                                </span>
                                                {event.event_data?.recipe_id && (
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        recipe #{event.event_data.recipe_id}
                                                    </span>
                                                )}
                                                {event.event_data?.platform && (
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        via {event.event_data.platform}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(event.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

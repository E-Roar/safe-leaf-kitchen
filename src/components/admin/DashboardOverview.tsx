import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Scan, Leaf, ChefHat, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Stats {
    totalScans: number;
    leafViews: number;
    recipeViews: number;
    chatMessages: number;
    totalLeaves: number;
    totalRecipes: number;
}

interface DailyData {
    date: string;
    scans: number;
    views: number;
}

export const DashboardOverview = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchDailyData();
        fetchRecentEvents();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('app_events_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'app_events' },
                () => {
                    // Refresh stats on new event
                    fetchStats();
                    fetchRecentEvents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch event counts by type
            const { data: events, error } = await supabase
                .from('app_events')
                .select('event_type');

            if (error) throw error;

            const counts = {
                totalScans: 0,
                leafViews: 0,
                recipeViews: 0,
                chatMessages: 0,
            };

            events?.forEach((e: any) => {
                switch (e.event_type) {
                    case 'scan': counts.totalScans++; break;
                    case 'leaf_view': counts.leafViews++; break;
                    case 'recipe_view':
                    case 'recipe_use': counts.recipeViews++; break;
                    case 'chat_message': counts.chatMessages++; break;
                }
            });

            // Fetch content counts
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
    };

    const fetchDailyData = async () => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data, error } = await supabase
                .from('app_events')
                .select('event_type, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            // Group by day
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
    };

    const fetchRecentEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('app_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setRecentEvents(data || []);
        } catch (error) {
            console.error('Error fetching recent events:', error);
        }
    };

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
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Real-time app usage analytics</p>
            </div>

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
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentEvents.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No events recorded yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentEvents.map((event) => (
                                <div key={event.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            {event.event_type === 'scan' && <Scan className="w-4 h-4 text-blue-500" />}
                                            {event.event_type === 'leaf_view' && <Leaf className="w-4 h-4 text-emerald-500" />}
                                            {event.event_type.includes('recipe') && <ChefHat className="w-4 h-4 text-orange-500" />}
                                            {event.event_type === 'chat_message' && <MessageCircle className="w-4 h-4 text-purple-500" />}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 capitalize">
                                            {event.event_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(event.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

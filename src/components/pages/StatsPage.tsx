import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Scan, MessageCircle, Leaf, TrendingUp, Calendar, Award, ChefHat, Zap, Coins, TreePine, RefreshCw, BarChart3, LineChart } from "lucide-react";
import { APIService } from "@/services/apiService";
import { AnalyticsService } from "@/services/analyticsService";
import { recipes } from "@/data/recipes";
import { ImpactService, ImpactMetrics } from "@/services/impactService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Area, AreaChart } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDebugPanel from "@/components/ui/MobileDebugPanel";
import { ChromeCompatibilityChecker, ChromeCompatibilityReport } from "@/utils/chromeCompatibility";
import { RemoteErrorLogger } from "@/utils/remoteErrorLogger";

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  change?: string;
}

interface LeafData {
  name: string;
  count: number;
  percentage: number;
}

export default function StatsPage() {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    totalScans: 0,
    totalChats: 0,
    detectedLeaves: {} as Record<string, number>,
    recipeSuggestions: 0,
    savedConversations: 0,
    impactMetrics: {} as ImpactMetrics
  });

  const [analyticsData, setAnalyticsData] = useState({
    dailyScans: [] as { date: string; value: number }[],
    dailyChats: [] as { date: string; value: number }[],
    weeklyStats: [] as any[],
    leafTrends: [] as any[]
  });

  const [debugInfo, setDebugInfo] = useState({
    detectedLeavesRaw: '',
    impactCalculation: '',
    storageKeys: [] as string[],
    recipesReceived: 0,
    favoritesCount: 0
  });

  const [chromeCompatibility, setChromeCompatibility] = useState<ChromeCompatibilityReport | null>(null);

  useEffect(() => {
    // Run Chrome compatibility check on mount
    console.log('Running Chrome compatibility check...');
    RemoteErrorLogger.log('info', 'Stats page loaded - starting compatibility check');
    
    const compatReport = ChromeCompatibilityChecker.generateReport();
    setChromeCompatibility(compatReport);
    
    // Log compatibility issues if any
    if (compatReport.issues.length > 0) {
      console.warn('Chrome compatibility issues detected:', compatReport.issues);
      RemoteErrorLogger.log('warn', 'Chrome compatibility issues detected', {
        issueCount: compatReport.issues.length,
        issues: compatReport.issues,
        browser: compatReport.isChrome ? `Chrome ${compatReport.version}` : 'Not Chrome',
        mobile: compatReport.isMobile
      });
    } else {
      RemoteErrorLogger.log('info', 'No Chrome compatibility issues detected');
    }
    
    // Run quick test for debugging
    ChromeCompatibilityChecker.runQuickTest();
    
    const loadStats = () => {
      try {
        console.log('Loading stats - Starting...');
        RemoteErrorLogger.log('debug', 'Stats loading started');
        
        const detectedLeaves = APIService.getDetectedLeaves();
        console.log('Detected leaves loaded:', detectedLeaves.length);
        RemoteErrorLogger.log('debug', 'Detected leaves loaded', { count: detectedLeaves.length });
        
        const impactMetrics = ImpactService.getCumulativeImpact();
        console.log('Impact metrics loaded:', impactMetrics);
        RemoteErrorLogger.log('debug', 'Impact metrics loaded', impactMetrics);
      
      // Convert detected leaves to the expected format
      const detectedLeavesRecord: Record<string, number> = {};
      detectedLeaves.forEach((detection, index) => {
        detection.leaves.forEach(leaf => {
          const leafType = leaf.class;
          detectedLeavesRecord[leafType] = (detectedLeavesRecord[leafType] || 0) + 1;
        });
      });

        setStats({
          totalScans: APIService.getScans(),
          totalChats: APIService.getChats(),
          detectedLeaves: detectedLeavesRecord,
          recipeSuggestions: APIService.getRecipeSuggestions(),
          savedConversations: APIService.getConversationList().length,
          impactMetrics
        });
        console.log('Stats updated successfully');
        RemoteErrorLogger.log('debug', 'Stats updated successfully', {
          totalScans: APIService.getScans(),
          totalChats: APIService.getChats(),
          detectedLeavesCount: Object.keys(detectedLeavesRecord).length
        });

        // Load analytics data for charts
        console.log('Loading analytics data...');
        const analyticsData = {
          dailyScans: AnalyticsService.getScanTrend(14), // Last 14 days
          dailyChats: AnalyticsService.getChatTrend(14),
          weeklyStats: AnalyticsService.getWeeklyStatsRange(8), // Last 8 weeks
          leafTrends: AnalyticsService.getLeafDetectionTrend(7) // Last 7 days
        };
        console.log('Analytics data loaded:', analyticsData);
        setAnalyticsData(analyticsData);
        RemoteErrorLogger.log('debug', 'Analytics data loaded', {
          dailyScansCount: analyticsData.dailyScans.length,
          dailyChatsCount: analyticsData.dailyChats.length,
          weeklyStatsCount: analyticsData.weeklyStats.length,
          leafTrendsCount: analyticsData.leafTrends.length
        });

        // Debug information
        setDebugInfo({
          detectedLeavesRaw: JSON.stringify(detectedLeaves, null, 2),
          impactCalculation: JSON.stringify(impactMetrics, null, 2),
          storageKeys: Object.keys(localStorage).filter(key => key.includes('safeleaf')),
          recipesReceived: APIService.getRecipeViews().length,
          favoritesCount: APIService.getFavoriteRecipes().length
        });
        console.log('Stats loading completed successfully');
        RemoteErrorLogger.log('info', 'Stats loading completed successfully');
      } catch (error) {
        console.error('Error loading stats:', error);
        RemoteErrorLogger.log('error', 'Error loading stats', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Set fallback values to prevent UI crashes
        setStats({
          totalScans: 0,
          totalChats: 0,
          detectedLeaves: {},
          recipeSuggestions: 0,
          savedConversations: 0,
          impactMetrics: {} as ImpactMetrics
        });
        setAnalyticsData({
          dailyScans: [],
          dailyChats: [],
          weeklyStats: [],
          leafTrends: []
        });
      }
    };

    loadStats();
    // Refresh stats when component becomes visible
    const interval = setInterval(() => {
      console.log('Refreshing stats...');
      loadStats();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Clear all data
  const clearAllData = () => {
    RemoteErrorLogger.log('info', 'Clearing all data');
    localStorage.clear();
    window.location.reload();
  };

  // Debug helper function accessible from browser console
  useEffect(() => {
    // Make debug functions globally accessible
    (window as any).safeLeafDebug = {
      showLogs: () => RemoteErrorLogger.displayDebugInfo(),
      exportLogs: () => RemoteErrorLogger.exportLogs(),
      clearLogs: () => RemoteErrorLogger.clearLogs(),
      getCompatibility: () => chromeCompatibility,
      shareDebugUrl: () => {
        const url = RemoteErrorLogger.createShareableDebugInfo();
        console.log('Debug URL:', url);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          console.log('Debug URL copied to clipboard');
        }
        return url;
      },
      testFeatures: () => {
        ChromeCompatibilityChecker.runQuickTest();
        RemoteErrorLogger.displayDebugInfo();
      }
    };
    
    console.log('🔍 Safe Leaf Debug commands available:');
    console.log('- safeLeafDebug.showLogs() - Show all error logs');
    console.log('- safeLeafDebug.exportLogs() - Export logs as JSON');
    console.log('- safeLeafDebug.shareDebugUrl() - Create shareable debug URL');
    console.log('- safeLeafDebug.testFeatures() - Test browser features');
    console.log('- safeLeafDebug.getCompatibility() - Get compatibility report');
    
    return () => {
      delete (window as any).safeLeafDebug;
    };
  }, [chromeCompatibility]);

  // Fixed percentage calculation with proper error handling
  const totalLeafCount = Object.values(stats.detectedLeaves).reduce((a, b) => a + b, 0);
  const topLeaves: LeafData[] = Object.entries(stats.detectedLeaves)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalLeafCount > 0 ? (count / totalLeafCount) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate recipe-based metrics with proper error handling
  const totalRecipes = recipes.length;
  
  // Calculate averages only if there are recipes
  const avgProteins = totalRecipes > 0 
    ? recipes.reduce((sum, recipe) => sum + (recipe.nutrition.proteins_g || 0), 0) / totalRecipes 
    : 0;
  
  const avgPolyphenols = totalRecipes > 0 
    ? recipes.reduce((sum, recipe) => sum + (recipe.nutrition.polyphenols_mg || 0), 0) / totalRecipes 
    : 0;
  
  const avgFlavonoids = totalRecipes > 0 
    ? recipes.reduce((sum, recipe) => sum + (recipe.nutrition.flavonoids_mg || 0), 0) / totalRecipes 
    : 0;
  
  const highAntioxidantRecipes = recipes.filter(recipe => {
    const score = recipe.nutrition.antioxidant_score?.toLowerCase() || '';
    return score.includes('élevé') || score.includes('high') || score.includes('très élevé') || score.includes('very high');
  }).length;

  // Calculate total nutrition values across all recipes
  const totalProteins = recipes.reduce((sum, recipe) => sum + (recipe.nutrition.proteins_g || 0), 0);
  const totalPolyphenols = recipes.reduce((sum, recipe) => sum + (recipe.nutrition.polyphenols_mg || 0), 0);
  const totalFlavonoids = recipes.reduce((sum, recipe) => sum + (recipe.nutrition.flavonoids_mg || 0), 0);

  // Enhanced impact calculations with proper formatting
  const moneySaved = stats.impactMetrics.price_saved_MAD || 0;
  const co2Avoided = stats.impactMetrics.co2e_kg_avoided || 0;
  const totalLeavesUsed = stats.impactMetrics.amount_g || 0;
  const polyphenolsGained = stats.impactMetrics.polyphenols_mg || 0;

  const statCards: StatCard[] = [
    {
      title: t('stats.card.totalScans'),
      value: stats.totalScans.toString(),
      icon: Scan,
      color: "bg-gradient-to-br from-primary/20 to-primary/10",
      change: "+12%"
    },
    {
      title: t('stats.card.chatMessages'),
      value: stats.totalChats.toString(),
      icon: MessageCircle,
      color: "bg-gradient-to-br from-accent/20 to-accent/10",
      change: "+8%"
    },
    {
      title: t('stats.card.availableRecipes'),
      value: totalRecipes.toString(),
      icon: ChefHat,
      color: "bg-gradient-to-br from-secondary/30 to-secondary/20",
      change: t('stats.card.suffix.moroccanInspired')
    },
    {
      title: t('stats.card.highAntioxidant'),
      value: highAntioxidantRecipes.toString(),
      icon: Zap,
      color: "bg-gradient-to-br from-primary/20 to-accent/10",
      change: t('stats.card.suffix.recipesAvailable')
    },
    {
      title: t('stats.card.recipesViewed'),
      value: debugInfo.recipesReceived.toString(),
      icon: ChefHat,
      color: "bg-gradient-to-br from-accent/20 to-secondary/10",
      change: t('stats.card.suffix.fromRecipes')
    },
    {
      title: t('stats.card.favorites'),
      value: debugInfo.favoritesCount.toString(),
      icon: ChefHat,
      color: "bg-gradient-to-br from-secondary/20 to-accent/10",
      change: t('stats.card.suffix.savedRecipes')
    },
    {
      title: t('stats.card.savedConversations'),
      value: stats.savedConversations.toString(),
      icon: MessageCircle,
      color: "bg-gradient-to-br from-secondary/20 to-accent/10",
      change: t('stats.card.suffix.conversationsStored')
    },
    {
      title: t('stats.card.moneySaved'),
      value: moneySaved.toFixed(2),
      icon: Coins,
      color: "bg-gradient-to-br from-green-500/20 to-green-600/10",
      change: t('stats.card.suffix.fromWildLeaves')
    },
    {
      title: t('stats.card.co2Avoided'),
      value: co2Avoided.toFixed(2),
      icon: TreePine,
      color: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
      change: t('stats.card.suffix.environmentalImpact')
    }
  ];

  const nutritionalInsights = [
    {
      title: "Avg Proteins",
      value: `${avgProteins.toFixed(1)}g`,
      description: "per recipe",
      color: "text-primary"
    },
    {
      title: "Avg Polyphenols",
      value: `${avgPolyphenols.toFixed(0)}mg`,
      description: "per recipe",
      color: "text-accent"
    },
    {
      title: "Avg Flavonoids",
      value: `${avgFlavonoids.toFixed(1)}mg`,
      description: "per recipe",
      color: "text-secondary"
    }
  ];

  const recipeTips = [
    "🍃 Onion leaves are rich in antioxidants and perfect for traditional Moroccan dishes",
    "🥘 Msemen with onion leaves combines traditional flatbread with nutritious greens",
    "🍳 Omelettes with fresh leaves provide a quick, protein-rich meal option",
    "🌿 Dried leaf powder preserves nutrients and adds flavor to soups and sauces"
  ];

  return (
    <div className={`min-h-screen p-2 sm:p-4 space-y-4 sm:space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t('stats.headerTitle')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('stats.headerSubtitle')}
        </p>
      </div>

      {/* Chrome Compatibility Warnings */}
      {chromeCompatibility && chromeCompatibility.issues.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-orange-800">
              Browser Compatibility Issues Detected
            </h3>
          </div>
          <div className="space-y-2 mb-4">
            {chromeCompatibility.issues.slice(0, 3).map((issue, index) => (
              <div key={index} className={`p-2 rounded-lg text-sm ${
                issue.type === 'error' ? 'bg-red-100 text-red-800' :
                issue.type === 'warning' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <div className="font-medium">[{issue.category}] {issue.message}</div>
                {issue.solution && (
                  <div className="text-xs mt-1 opacity-80">💡 {issue.solution}</div>
                )}
              </div>
            ))}
          </div>
          {chromeCompatibility.recommendations.length > 0 && (
            <div>
              <div className="text-sm font-medium text-orange-800 mb-2">Quick Fixes:</div>
              <div className="text-xs text-orange-700 space-y-1">
                {chromeCompatibility.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index}>• {rec}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Controls */}
      <div className="glass rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.controls')}</h3>
          <button
            onClick={clearAllData}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="whitespace-nowrap">{t('stats.resetAllData')}</span>
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          Viewed recipes: {debugInfo.recipesReceived} • Favorites: {debugInfo.favoritesCount}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {statCards.slice(0, 4).map((card, index) => (
          <div
            key={index}
            className={`glass rounded-2xl p-3 sm:p-4 relative overflow-hidden ${card.color}`}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl bg-primary/10`}>
                  <card.icon className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-accent font-medium">{card.change}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {statCards.slice(4, 6).map((card, index) => (
          <div
            key={index + 4}
            className={`glass rounded-2xl p-3 sm:p-4 relative overflow-hidden ${card.color}`}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-xl bg-primary/10`}>
                  <card.icon className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{card.title}</p>
                {card.change && (
                  <p className="text-xs text-accent font-medium">{card.change}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Daily Scans Trend */}
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-primary" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.charts.dailyScans')}</h3>
          </div>
          <div className={`${isMobile ? 'h-48' : 'h-64'} w-full`}>
            <ChartContainer
              config={{
                scans: {
                  label: "Scans",
                  color: "hsl(var(--primary))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={analyticsData.dailyScans} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    interval={isMobile ? 1 : 0}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--color-scans)" 
                    strokeWidth={isMobile ? 1.5 : 2}
                    dot={{ fill: "var(--color-scans)", strokeWidth: 2, r: isMobile ? 3 : 4 }}
                    activeDot={{ r: isMobile ? 4 : 6, fill: "var(--color-scans)" }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Daily Chats Trend */}
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-accent" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.charts.dailyChats')}</h3>
          </div>
          <div className={`${isMobile ? 'h-48' : 'h-64'} w-full`}>
            <ChartContainer
              config={{
                chats: {
                  label: "Chats",
                  color: "hsl(var(--accent))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyChats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    interval={isMobile ? 1 : 0}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--color-chats)" 
                    fill="var(--color-chats)"
                    fillOpacity={0.3}
                    strokeWidth={isMobile ? 1.5 : 2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Weekly Activity Overview */}
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-secondary" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.charts.weeklyActivity')}</h3>
          </div>
          <div className={`${isMobile ? 'h-48' : 'h-64'} w-full`}>
            <ChartContainer
              config={{
                scans: {
                  label: "Scans",
                  color: "hsl(var(--primary))",
                },
                chats: {
                  label: "Chats",
                  color: "hsl(var(--accent))",
                },
                recipes: {
                  label: "Recipes",
                  color: "hsl(var(--secondary))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={analyticsData.weeklyStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    interval={isMobile ? "preserveStartEnd" : 0}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_scans" fill="var(--color-scans)" name="Scans" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="total_chats" fill="var(--color-chats)" name="Chats" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="total_recipes" fill="var(--color-recipes)" name="Recipes" radius={[2, 2, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Leaf Detection Distribution */}
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-green-500" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.charts.leafTrends')}</h3>
          </div>
          <div className={`${isMobile ? 'h-48' : 'h-64'} w-full`}>
            {analyticsData.leafTrends.length > 0 && Object.keys(analyticsData.leafTrends[0]).length > 1 ? (
              <ChartContainer
                config={Object.keys(analyticsData.leafTrends[0])
                  .filter(key => key !== 'date')
                  .reduce((config, leaf, index) => {
                    const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];
                    config[leaf] = {
                      label: leaf.charAt(0).toUpperCase() + leaf.slice(1),
                      color: colors[index % colors.length],
                    };
                    return config;
                  }, {} as any)
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={analyticsData.leafTrends} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? 1 : 0}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 30 : 40} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString();
                      }}
                    />
                    {Object.keys(analyticsData.leafTrends[0])
                      .filter(key => key !== 'date')
                      .map((leaf, index) => {
                        return (
                          <Line 
                            key={leaf}
                            type="monotone" 
                            dataKey={leaf} 
                            stroke={`var(--color-${leaf})`}
                            strokeWidth={isMobile ? 1.5 : 2}
                            dot={{ r: isMobile ? 2 : 3 }}
                            connectNulls={false}
                          />
                        );
                      })
                    }
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Leaf className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">{t('stats.charts.noData')}</p>
                  <p className="text-xs">{t('stats.charts.startScanning')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Detected Leaves */}
      {topLeaves.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.mostScannedLeaves')}</h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {topLeaves.map((leaf, index) => (
              <div key={leaf.name} className="flex items-center justify-between p-2 sm:p-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-primary text-primary-foreground' :
                    index === 1 ? 'bg-accent text-accent-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize text-sm sm:text-base">{leaf.name}</p>
                    <p className="text-xs text-muted-foreground">{leaf.count} scans</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{leaf.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutritional Insights */}
      <div className="glass rounded-2xl p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.nutritionalInsights')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {nutritionalInsights.map((insight, index) => (
            <div key={index} className="text-center p-3 sm:p-0">
              <p className={`text-xl sm:text-2xl font-bold ${insight.color}`}>{insight.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Tips */}
      <div className="glass rounded-2xl p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.recipeInsights')}</h3>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {recipeTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-organic rounded-xl">
              <div className="text-xs sm:text-sm text-foreground leading-relaxed">{tip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Nutrition Summary */}
      <div className="glass rounded-2xl p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('stats.recipeNutritionSummary')}</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.totalAntioxidantScore')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">Very High</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.avgProteins')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{avgProteins.toFixed(1)}g {t('stats.insight.perRecipe')}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.totalPolyphenols')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{avgPolyphenols.toFixed(0)}mg {t('stats.insight.perRecipe')}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.highAntioxidantRecipes')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{highAntioxidantRecipes}/{totalRecipes}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.totalProteinsAll')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{totalProteins.toFixed(1)}g</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.summary.totalPolyphenolsAll')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{totalPolyphenols.toFixed(0)}mg</span>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="glass rounded-2xl p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Leaf className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
          {t('stats.impact.header')}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 gap-2">
              <div className="flex items-center gap-3">
                <Coins className="w-5 sm:w-6 h-5 sm:h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('stats.impact.totalMoneySaved')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {moneySaved.toFixed(2)} MAD
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 gap-2">
              <div className="flex items-center gap-3">
                <TreePine className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('stats.impact.co2eAvoided')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                    {co2Avoided.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Leaf className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                <p className="text-xs sm:text-sm font-medium text-blue-600">{t('stats.impact.totalLeavesUsed')}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                {totalLeavesUsed.toFixed(1)} g
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.impact.wildLeavesNote')}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
                <p className="text-xs sm:text-sm font-medium text-purple-600">{t('stats.impact.polyphenolsGained')}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                {polyphenolsGained.toFixed(1)} mg
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('stats.impact.antioxidantCompoundsConsumed')}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            💚 {t('stats.impact.bottomNote')}
          </p>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="glass rounded-2xl p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('stats.thisWeekSummary')}</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.mostActiveDay')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">Wednesday</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.favoriteLeafType')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base capitalize">
              {topLeaves[0]?.name || t('stats.week.noDataYet')}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.averageSessionTime')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">3m 24s</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.recipesAvailable')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{totalRecipes}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.avgCookingTime')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">30 min</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
            <span className="text-muted-foreground text-xs sm:text-sm">{t('stats.week.totalLeafScans')}</span>
            <span className="font-medium text-foreground text-sm sm:text-base">{totalLeafCount}</span>
          </div>
        </div>
      </div>

      {/* Debug Information (hidden by default) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="glass rounded-2xl p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Debug Information</summary>
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <strong>Detected Leaves:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">{debugInfo.detectedLeavesRaw}</pre>
            </div>
            <div>
              <strong>Impact Calculation:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">{debugInfo.impactCalculation}</pre>
            </div>
            <div>
              <strong>Storage Keys:</strong>
              <div className="mt-2 p-2 bg-gray-100 rounded">
                {debugInfo.storageKeys.map(key => (
                  <div key={key} className="text-xs">{key}</div>
                ))}
              </div>
            </div>
          </div>
        </details>
      )}
      
      {/* Mobile Debug Panel */}
      {isMobile && <MobileDebugPanel />}
    </div>
  );
}
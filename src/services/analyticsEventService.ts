// Analytics Event Tracker - Lightweight service for tracking app usage
import { supabase } from '@/lib/supabaseClient';

type EventType = 'scan' | 'leaf_view' | 'recipe_view' | 'recipe_use' | 'chat_message';

interface EventData {
    leaf_id?: string | number;
    recipe_id?: string | number;
    message_length?: number;
    [key: string]: any;
}

/**
 * Track an app event for analytics.
 * Events are stored anonymously in the `app_events` table.
 */
export const trackEvent = async (eventType: EventType, eventData?: EventData): Promise<void> => {
    try {
        const { error } = await supabase.from('app_events').insert({
            event_type: eventType,
            event_data: eventData || {},
        });

        if (error) {
            console.warn('Failed to track event:', error.message);
        }
    } catch (err) {
        // Silent fail - analytics should never break the app
        console.warn('Analytics tracking error:', err);
    }
};

// Convenience methods
export const Analytics = {
    trackScan: (leafId?: string | number) => trackEvent('scan', leafId ? { leaf_id: leafId } : undefined),
    trackLeafView: (leafId: string | number) => trackEvent('leaf_view', { leaf_id: leafId }),
    trackRecipeView: (recipeId: string | number) => trackEvent('recipe_view', { recipe_id: recipeId }),
    trackRecipeUse: (recipeId: string | number) => trackEvent('recipe_use', { recipe_id: recipeId }),
    trackChatMessage: (messageLength?: number) => trackEvent('chat_message', messageLength ? { message_length: messageLength } : undefined),
};

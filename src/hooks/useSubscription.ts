import { useSubscriptionStore } from '@stores/subscriptionStore';
import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@constants/queryKeys';
import { supabase } from '@lib/supabase';
import { AI_LIMITS } from '@app-types/subscription';

export function useSubscription() {
  const { user } = useAuth();
  const { status, monthlyAiUsage, setStatus, setMonthlyAiUsage } = useSubscriptionStore();

  useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, monthly_ai_usage')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      setStatus(data.subscription_status as never);
      setMonthlyAiUsage(data.monthly_ai_usage);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const limit = AI_LIMITS[status];
  const remaining = Math.max(0, limit - monthlyAiUsage);

  return {
    status,
    monthlyAiUsage,
    limit,
    remaining,
    canUseAI: remaining > 0,
    isPro: status === 'pro',
    isPlus: status === 'plus' || status === 'pro',
    isFree: status === 'free',
  };
}

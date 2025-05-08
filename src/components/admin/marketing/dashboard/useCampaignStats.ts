
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCampaignStats = () => {
  return useQuery({
    queryKey: ['marketing-dashboard-campaigns'],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('status');
      
      if (error) throw new Error(error.message);
      
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const totalCampaigns = campaigns.length;
      
      return {
        active: activeCampaigns,
        total: totalCampaigns
      };
    },
  });
};

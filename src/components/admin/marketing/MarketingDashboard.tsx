
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tag, Users, Calendar, TrendingUp } from 'lucide-react';

const MarketingDashboard: React.FC = () => {
  // Fetch campaigns stats
  const { data: campaignStats } = useQuery({
    queryKey: ['marketing-dashboard-campaigns'],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('status')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
      };
      
      return stats;
    },
  });

  // Fetch coupon stats
  const { data: couponStats } = useQuery({
    queryKey: ['marketing-dashboard-coupons'],
    queryFn: async () => {
      const { data: coupons, error } = await supabase
        .from('discount_coupons')
        .select('current_uses, is_active, discount_type, valid_until');
      
      if (error) throw new Error(error.message);
      
      const stats = {
        total: coupons.length,
        active: coupons.filter(c => c.is_active).length,
        expired: coupons.filter(c => c.valid_until && new Date(c.valid_until) < new Date()).length,
        totalUses: coupons.reduce((sum, coupon) => sum + (coupon.current_uses || 0), 0),
      };
      
      return stats;
    },
  });

  // Prepare chart data
  const chartData = [
    { name: 'Cupons Ativos', valor: couponStats?.active || 0 },
    { name: 'Campanhas Ativas', valor: campaignStats?.active || 0 },
    { name: 'Campanhas Concluídas', valor: campaignStats?.completed || 0 },
    { name: 'Total de Usos', valor: couponStats?.totalUses || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              De {campaignStats?.total || 0} campanhas totais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cupons Ativos</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponStats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              De {couponStats?.total || 0} cupons totais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usos de Cupons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couponStats?.totalUses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de utilizações de cupons
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Métricas em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Visão Geral de Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="valor" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;

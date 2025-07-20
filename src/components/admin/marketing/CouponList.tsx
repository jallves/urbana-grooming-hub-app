
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Tag, Calendar, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DiscountCoupon } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import CouponForm from './CouponForm';

const CouponList = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<DiscountCoupon | null>(null);
  const { toast } = useToast();

  const { data: coupons, isLoading, error, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*, marketing_campaigns(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as (DiscountCoupon & { marketing_campaigns: { name: string } | null })[];
    },
  });

  // Set up real-time subscription for coupons
  useEffect(() => {
    const channel = supabase
      .channel('coupon-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'discount_coupons'
        },
        (payload) => {
          console.log('Coupon data changed:', payload);
          toast({
            title: 'Atualização',
            description: 'Dados de cupons atualizados'
          });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, toast]);

  const handleEdit = (coupon: DiscountCoupon) => {
    setSelectedCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    setIsDialogOpen(false);
    setSelectedCoupon(null);
    refetch();
    toast({
      title: 'Sucesso',
      description: 'Cupom salvo com sucesso!',
    });
  };

  const formatDiscountValue = (coupon: DiscountCoupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p className="text-sm">Erro ao carregar cupons</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Cupons de Desconto</h3>
          <p className="text-xs text-gray-400">Gerencie seus cupons</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 h-auto"
        >
          <Plus className="mr-1 h-3 w-3" />
          Novo
        </Button>
      </div>

      {/* Coupons Grid */}
      {coupons && coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {coupons.map((coupon) => (
            <Card 
              key={coupon.id} 
              className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => handleEdit(coupon)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-400" />
                    {coupon.code}
                  </CardTitle>
                  <Badge variant={coupon.is_active ? 'default' : 'secondary'} className="text-xs">
                    {coupon.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <Percent className="h-3 w-3" />
                  <span>{formatDiscountValue(coupon)}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Calendar className="h-3 w-3" />
                    <span>De: {format(new Date(coupon.valid_from), 'dd/MM/yyyy')}</span>
                  </div>
                  
                  {coupon.valid_until && (
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <Calendar className="h-3 w-3" />
                      <span>Até: {format(new Date(coupon.valid_until), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    Usos: {coupon.current_uses || 0}
                    {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                  </div>
                  
                  {coupon.marketing_campaigns?.name && (
                    <div className="text-xs text-gray-400">
                      Campanha: {coupon.marketing_campaigns.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Tag className="mx-auto h-8 w-8 text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Nenhum cupom encontrado
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            Crie um novo cupom para começar
          </p>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Cupom
          </Button>
        </div>
      )}
      
      <CouponForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCoupon(null);
        }}
        onSubmit={handleFormSubmit}
        coupon={selectedCoupon}
      />
    </div>
  );
};

export default CouponList;

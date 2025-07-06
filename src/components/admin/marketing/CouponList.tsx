
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DiscountCoupon } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
          refetch(); // Refresh data when changes occur
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

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-900">Cupons de Desconto</CardTitle>
          <CardDescription className="text-gray-600">
            Gerencie seus cupons de desconto para campanhas
          </CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-gray-700">Carregando...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            Erro ao carregar cupons. Por favor, tente novamente.
          </div>
        ) : coupons && coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Código</TableHead>
                  <TableHead className="text-gray-900">Desconto</TableHead>
                  <TableHead className="text-gray-900">Validade</TableHead>
                  <TableHead className="text-gray-900">Campanha</TableHead>
                  <TableHead className="text-gray-900">Utilizações</TableHead>
                  <TableHead className="text-gray-900">Status</TableHead>
                  <TableHead className="text-right text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium flex items-center text-gray-900">
                      <Tag className="h-4 w-4 mr-2 text-purple-500" />
                      {coupon.code}
                    </TableCell>
                    <TableCell className="text-gray-700">{formatDiscountValue(coupon)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">De:</span>
                        <span className="text-gray-700">{format(new Date(coupon.valid_from), 'dd/MM/yyyy')}</span>
                        {coupon.valid_until && (
                          <>
                            <span className="text-xs text-gray-500 mt-1">Até:</span>
                            <span className="text-gray-700">{format(new Date(coupon.valid_until), 'dd/MM/yyyy')}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {coupon.marketing_campaigns?.name || '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {coupon.current_uses || 0}
                      {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Nenhum cupom encontrado. Crie um novo cupom para começar.
          </div>
        )}
      </CardContent>
      
      <CouponForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCoupon(null);
        }}
        onSubmit={handleFormSubmit}
        coupon={selectedCoupon}
      />
    </Card>
  );
};

export default CouponList;

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ticket, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface AppliedCoupon {
  coupon_id: string;
  code: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface CouponInputProps {
  servicePrice: number;
  applied: AppliedCoupon | null;
  onApplied: (c: AppliedCoupon) => void;
  onRemoved: () => void;
}

const CouponInput: React.FC<CouponInputProps> = ({ servicePrice, applied, onApplied, onRemoved }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error('Digite o código do cupom');
      return;
    }
    if (!servicePrice || servicePrice <= 0) {
      toast.error('Selecione um serviço antes de aplicar o cupom');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon' as any, {
        p_code: trimmed,
        p_service_price: servicePrice,
      });

      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.error || 'Cupom inválido');
        return;
      }

      onApplied({
        coupon_id: result.coupon_id,
        code: result.code,
        discount_amount: Number(result.discount_amount || 0),
        original_amount: Number(result.original_amount || servicePrice),
        final_amount: Number(result.final_amount || servicePrice),
        discount_type: result.discount_type,
        discount_value: Number(result.discount_value || 0),
      });
      setCode('');
      toast.success(`Cupom ${result.code} aplicado!`);
    } catch (err: any) {
      console.error('Erro ao validar cupom:', err);
      toast.error(err?.message || 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Cupom {applied.code} aplicado
              </p>
              <p className="text-xs text-white/70">
                Desconto: {applied.discount_type === 'percentage'
                  ? `${applied.discount_value}%`
                  : `R$ ${applied.discount_value.toFixed(2)}`}
                {' '}(- R$ {applied.discount_amount.toFixed(2)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoved}
            className="text-white/70 hover:text-white shrink-0"
            aria-label="Remover cupom"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-urbana-black/30 border border-urbana-gold/20 rounded-lg p-3">
      <p className="text-xs text-white/60 mb-2 flex items-center gap-1.5">
        <Ticket className="w-3.5 h-3.5 text-urbana-gold" />
        Tem cupom de desconto?
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código do cupom"
          className="bg-urbana-black/40 border-urbana-gold/30 text-white placeholder:text-white/40 uppercase"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-semibold shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
        </Button>
      </div>
    </div>
  );
};

export default CouponInput;
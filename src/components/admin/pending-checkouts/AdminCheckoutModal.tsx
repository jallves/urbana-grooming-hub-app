import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Gift, Edit3, DollarSign } from 'lucide-react';

interface CheckoutData {
  appointmentId: string;
  sessionId: string;
  clientName: string;
  barberName: string;
  serviceName: string;
  servicePrice: number;
}

interface AdminCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CheckoutData | null;
  isProcessing: boolean;
  onConfirm: (sessionId: string, checkoutType: 'full' | 'courtesy' | 'custom', customValue?: number) => void;
}

const AdminCheckoutModal: React.FC<AdminCheckoutModalProps> = ({
  open,
  onOpenChange,
  data,
  isProcessing,
  onConfirm,
}) => {
  const [checkoutType, setCheckoutType] = useState<'full' | 'courtesy' | 'custom'>('full');
  const [customValue, setCustomValue] = useState('');

  if (!data) return null;

  const getFinalValue = () => {
    switch (checkoutType) {
      case 'courtesy': return 0;
      case 'custom': return parseFloat(customValue) || 0;
      case 'full': return data.servicePrice;
    }
  };

  const handleConfirm = () => {
    onConfirm(
      data.sessionId,
      checkoutType,
      checkoutType === 'custom' ? parseFloat(customValue) || 0 : undefined
    );
  };

  const finalValue = getFinalValue();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Realizar Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-semibold">{data.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Barbeiro</span>
              <span className="font-semibold">{data.barberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviço</span>
              <span className="font-semibold">{data.serviceName}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">Valor original</span>
              <span className="font-bold text-green-600">R$ {data.servicePrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Tipo de checkout */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipo de Checkout</Label>
            <RadioGroup
              value={checkoutType}
              onValueChange={(v) => setCheckoutType(v as 'full' | 'courtesy' | 'custom')}
              className="space-y-2"
            >
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checkoutType === 'full' ? 'border-green-500 bg-green-50' : 'border-border hover:bg-muted/50'}`}>
                <RadioGroupItem value="full" />
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Valor Total</p>
                  <p className="text-xs text-muted-foreground">Cobra o valor integral do serviço</p>
                </div>
                <span className="font-bold text-green-600">R$ {data.servicePrice.toFixed(2)}</span>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checkoutType === 'courtesy' ? 'border-purple-500 bg-purple-50' : 'border-border hover:bg-muted/50'}`}>
                <RadioGroupItem value="courtesy" />
                <Gift className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Cortesia</p>
                  <p className="text-xs text-muted-foreground">Serviço gratuito, sem cobrança</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">Grátis</Badge>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checkoutType === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-border hover:bg-muted/50'}`}>
                <RadioGroupItem value="custom" />
                <Edit3 className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Valor Personalizado</p>
                  <p className="text-xs text-muted-foreground">Definir um valor diferente</p>
                </div>
              </label>
            </RadioGroup>

            {checkoutType === 'custom' && (
              <div className="ml-10 space-y-1">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="max-w-[200px]"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Valor final */}
          <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
            <span className="font-semibold">Valor Final</span>
            <span className={`text-2xl font-bold ${finalValue === 0 ? 'text-purple-600' : 'text-green-600'}`}>
              {finalValue === 0 ? 'CORTESIA' : `R$ ${finalValue.toFixed(2)}`}
            </span>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ O checkout será finalizado <strong>sem acionar o terminal de pagamento</strong>. 
              A venda, comissão e registros financeiros serão criados automaticamente.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || (checkoutType === 'custom' && (!customValue || parseFloat(customValue) < 0))}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? 'Processando...' : 'Confirmar Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCheckoutModal;

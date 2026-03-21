import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Gift, Edit3, DollarSign, Users } from 'lucide-react';

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
  onConfirm: (sessionId: string, checkoutType: 'full' | 'courtesy' | 'custom', customValue?: number, payCommission?: boolean) => void;
}

const COMMISSION_RATE = 40;

const AdminCheckoutModal: React.FC<AdminCheckoutModalProps> = ({
  open,
  onOpenChange,
  data,
  isProcessing,
  onConfirm,
}) => {
  const [checkoutType, setCheckoutType] = useState<'full' | 'courtesy' | 'custom'>('full');
  const [customValue, setCustomValue] = useState('');
  const [payCommission, setPayCommission] = useState(true);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (open) {
      setCheckoutType('full');
      setCustomValue('');
      setPayCommission(true);
    }
  }, [open]);

  if (!data) return null;

  const getFinalValue = () => {
    switch (checkoutType) {
      case 'courtesy': return 0;
      case 'custom': return parseFloat(customValue) || 0;
      case 'full': return data.servicePrice;
    }
  };

  const getCommissionBase = () => {
    if (checkoutType === 'courtesy') return data.servicePrice; // Commission on full original price
    if (checkoutType === 'custom') return parseFloat(customValue) || 0; // Commission on custom value
    return data.servicePrice; // Full price
  };

  const commissionValue = payCommission ? getCommissionBase() * (COMMISSION_RATE / 100) : 0;

  const handleConfirm = () => {
    onConfirm(
      data.sessionId,
      checkoutType,
      checkoutType === 'custom' ? parseFloat(customValue) || 0 : undefined,
      payCommission
    );
  };

  const finalValue = getFinalValue();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  <p className="text-xs text-muted-foreground">Cliente não paga, valor R$ 0</p>
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

          {/* Comissão do barbeiro */}
          <div className={`rounded-lg border p-4 space-y-3 ${payCommission ? 'border-blue-300 bg-blue-50/50' : 'border-border'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <Label htmlFor="pay-commission" className="text-sm font-semibold cursor-pointer">
                  Pagar comissão ao barbeiro
                </Label>
              </div>
              <Switch
                id="pay-commission"
                checked={payCommission}
                onCheckedChange={setPayCommission}
              />
            </div>

            {payCommission && (
              <div className="text-xs space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Base de cálculo</span>
                  <span className="font-medium">
                    R$ {checkoutType === 'courtesy' ? data.servicePrice.toFixed(2) : (checkoutType === 'custom' ? (parseFloat(customValue) || 0).toFixed(2) : data.servicePrice.toFixed(2))}
                    {checkoutType === 'courtesy' && <span className="text-purple-600 ml-1">(valor original)</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa</span>
                  <span className="font-medium">{COMMISSION_RATE}%</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-sm font-semibold text-foreground">
                  <span>Comissão</span>
                  <span className="text-blue-600">R$ {commissionValue.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
                  💡 {checkoutType === 'courtesy'
                    ? 'Cortesia: comissão calculada sobre o valor original do serviço'
                    : checkoutType === 'custom'
                      ? 'Comissão calculada sobre o valor personalizado'
                      : 'Comissão calculada sobre o valor total'
                  }
                </p>
              </div>
            )}

            {!payCommission && (
              <p className="text-xs text-muted-foreground">
                Nenhuma comissão será gerada para o barbeiro neste checkout.
              </p>
            )}
          </div>

          {/* Resumo financeiro */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo ERP</p>
            <div className="flex justify-between text-sm">
              <span>Contas a Receber</span>
              <span className={`font-bold ${finalValue === 0 ? 'text-purple-600' : 'text-green-600'}`}>
                {finalValue === 0 ? 'R$ 0,00 (cortesia)' : `R$ ${finalValue.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Contas a Pagar (comissão)</span>
              <span className={`font-bold ${commissionValue > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {commissionValue > 0 ? `R$ ${commissionValue.toFixed(2)}` : 'Sem comissão'}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 font-semibold">
              <span>Resultado líquido</span>
              <span className={finalValue - commissionValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                R$ {(finalValue - commissionValue).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              ⚠️ O checkout será finalizado <strong>sem acionar o terminal de pagamento</strong>. 
              Os registros financeiros serão criados automaticamente no ERP.
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

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Gift, Edit3, DollarSign, Users, Plus, Minus, Trash2, Package, Scissors } from 'lucide-react';

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
  onConfirm: (
    sessionId: string,
    checkoutType: 'full' | 'courtesy' | 'custom',
    customValue: number | undefined,
    payCommission: boolean,
    extras: { extra_services: Array<{ id: string; quantidade: number }>; extra_products: Array<{ id: string; quantidade: number }>; payment_method: string }
  ) => void;
}

const COMMISSION_RATE = 40;

type CatalogService = { id: string; nome: string; preco: number };
type CatalogProduct = { id: string; nome: string; preco: number; estoque: number };
type AddedItem = { id: string; nome: string; preco: number; qty: number };

const PAYMENT_METHODS = [
  { value: 'admin', label: 'Admin (genérico)' },
  { value: 'externo', label: 'Pagamento Externo' },
  { value: 'pix', label: 'PIX' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

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
  const [paymentMethod, setPaymentMethod] = useState<string>('admin');

  const [services, setServices] = useState<CatalogService[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [addedServices, setAddedServices] = useState<AddedItem[]>([]);
  const [addedProducts, setAddedProducts] = useState<AddedItem[]>([]);
  const [serviceToAdd, setServiceToAdd] = useState<string>('');
  const [productToAdd, setProductToAdd] = useState<string>('');

  // Reset state when modal opens with new data
  useEffect(() => {
    if (open) {
      setCheckoutType('full');
      setCustomValue('');
      setPayCommission(true);
      setPaymentMethod('admin');
      setAddedServices([]);
      setAddedProducts([]);
      setServiceToAdd('');
      setProductToAdd('');
      // Load catalogs
      (async () => {
        const [{ data: svc }, { data: prd }] = await Promise.all([
          supabase.from('painel_servicos').select('id,nome,preco').eq('ativo', true).order('nome'),
          supabase.from('painel_produtos').select('id,nome,preco,estoque').eq('ativo', true).order('nome'),
        ]);
        setServices((svc || []) as CatalogService[]);
        setProducts((prd || []) as CatalogProduct[]);
      })();
    }
  }, [open]);

  const addService = () => {
    const s = services.find(x => x.id === serviceToAdd);
    if (!s) return;
    setAddedServices(prev => {
      const existing = prev.find(p => p.id === s.id);
      if (existing) return prev.map(p => p.id === s.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { id: s.id, nome: s.nome, preco: Number(s.preco), qty: 1 }];
    });
    setServiceToAdd('');
  };
  const addProduct = () => {
    const p = products.find(x => x.id === productToAdd);
    if (!p) return;
    setAddedProducts(prev => {
      const existing = prev.find(x => x.id === p.id);
      if (existing) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { id: p.id, nome: p.nome, preco: Number(p.preco), qty: 1 }];
    });
    setProductToAdd('');
  };

  const updateQty = (list: 'svc' | 'prd', id: string, qty: number) => {
    const q = Math.max(1, Math.floor(qty || 1));
    if (list === 'svc') setAddedServices(prev => prev.map(i => i.id === id ? { ...i, qty: q } : i));
    else setAddedProducts(prev => prev.map(i => i.id === id ? { ...i, qty: q } : i));
  };
  const removeItem = (list: 'svc' | 'prd', id: string) => {
    if (list === 'svc') setAddedServices(prev => prev.filter(i => i.id !== id));
    else setAddedProducts(prev => prev.filter(i => i.id !== id));
  };

  const extraServicesTotal = useMemo(() => addedServices.reduce((s, i) => s + i.preco * i.qty, 0), [addedServices]);
  const extraProductsTotal = useMemo(() => addedProducts.reduce((s, i) => s + i.preco * i.qty, 0), [addedProducts]);

  if (!data) return null;

  const getFinalValue = () => {
    let base = 0;
    switch (checkoutType) {
      case 'courtesy': base = 0; break;
      case 'custom': base = parseFloat(customValue) || 0; break;
      case 'full': base = data.servicePrice; break;
    }
    return base + extraServicesTotal + extraProductsTotal;
  };

  const getCommissionBase = () => {
    let base = 0;
    if (checkoutType === 'courtesy') base = data.servicePrice;
    else if (checkoutType === 'custom') base = parseFloat(customValue) || 0;
    else base = data.servicePrice;
    return base + extraServicesTotal;
  };

  const commissionValue = payCommission ? getCommissionBase() * (COMMISSION_RATE / 100) : 0;

  const handleConfirm = () => {
    onConfirm(
      data.sessionId,
      checkoutType,
      checkoutType === 'custom' ? parseFloat(customValue) || 0 : undefined,
      payCommission,
      {
        extra_services: addedServices.map(i => ({ id: i.id, quantidade: i.qty })),
        extra_products: addedProducts.map(i => ({ id: i.id, quantidade: i.qty })),
        payment_method: paymentMethod,
      }
    );
  };

  const finalValue = getFinalValue();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
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

          {/* Serviços extras */}
          <div className="space-y-2 border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold">Serviços Extras</Label>
            </div>
            <div className="flex gap-2">
              <Select value={serviceToAdd} onValueChange={setServiceToAdd}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um serviço para adicionar" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addService} disabled={!serviceToAdd} size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            {addedServices.length > 0 && (
              <div className="space-y-1">
                {addedServices.map(i => (
                  <div key={i.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-2 py-1.5">
                    <span className="flex-1 truncate">{i.nome}</span>
                    <div className="flex items-center gap-1 bg-background rounded-full border shadow-sm">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => i.qty <= 1 ? removeItem('svc', i.id) : updateQty('svc', i.id, i.qty - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-[24px] text-center font-bold text-sm">{i.qty}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQty('svc', i.id, i.qty + 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="w-20 text-right font-semibold">R$ {(i.preco * i.qty).toFixed(2)}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem('svc', i.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="text-right text-xs text-muted-foreground">Subtotal extras: <span className="font-bold text-foreground">R$ {extraServicesTotal.toFixed(2)}</span></div>
              </div>
            )}
          </div>

          {/* Produtos */}
          <div className="space-y-2 border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <Label className="text-sm font-semibold">Produtos</Label>
            </div>
            <div className="flex gap-2">
              <Select value={productToAdd} onValueChange={setProductToAdd}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} disabled={p.estoque <= 0}>
                      {p.nome} — R$ {Number(p.preco).toFixed(2)} {p.estoque <= 0 ? '(sem estoque)' : `(${p.estoque} em estoque)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addProduct} disabled={!productToAdd} size="sm"><Plus className="h-4 w-4" /></Button>
            </div>
            {addedProducts.length > 0 && (
              <div className="space-y-1">
                {addedProducts.map(i => {
                  const stock = products.find(p => p.id === i.id)?.estoque ?? 99;
                  const atMax = i.qty >= stock;
                  return (
                    <div key={i.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-2 py-1.5">
                      <span className="flex-1 truncate">{i.nome}</span>
                      <div className="flex items-center gap-1 bg-background rounded-full border shadow-sm">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => i.qty <= 1 ? removeItem('prd', i.id) : updateQty('prd', i.id, i.qty - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-[24px] text-center font-bold text-sm">{i.qty}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full" disabled={atMax} onClick={() => updateQty('prd', i.id, i.qty + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="w-20 text-right font-semibold">R$ {(i.preco * i.qty).toFixed(2)}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem('prd', i.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  );
                })}
                <div className="text-right text-xs text-muted-foreground">Subtotal produtos: <span className="font-bold text-foreground">R$ {extraProductsTotal.toFixed(2)}</span></div>
              </div>
            )}
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {paymentMethod === 'externo' && (
              <p className="text-xs text-muted-foreground">Cliente pagou fora do sistema (dinheiro físico, transferência etc).</p>
            )}
          </div>

          {/* Comissão do barbeiro - aparece APENAS para cortesia */}
          {checkoutType === 'courtesy' && (
            <div className={`rounded-lg border-2 p-4 space-y-3 transition-colors ${payCommission ? 'border-purple-400 bg-purple-50' : 'border-orange-400 bg-orange-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-bold">Comissão do Barbeiro</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O cliente não será cobrado. Deseja que a barbearia pague a comissão ao barbeiro sobre o valor original do serviço?
              </p>

              <div className="flex items-center justify-between bg-background rounded-lg p-3 border">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="pay-commission" className="text-sm font-semibold cursor-pointer">
                    Pagar comissão ao barbeiro?
                  </Label>
                </div>
                <Switch
                  id="pay-commission"
                  checked={payCommission}
                  onCheckedChange={setPayCommission}
                />
              </div>

              {payCommission ? (
                <div className="bg-purple-100 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Base (valor original)</span>
                    <span className="font-bold text-purple-800">R$ {data.servicePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Taxa</span>
                    <span className="font-bold text-purple-800">{COMMISSION_RATE}%</span>
                  </div>
                  <div className="flex justify-between border-t border-purple-300 pt-1 text-sm">
                    <span className="font-semibold text-purple-800">Comissão a pagar</span>
                    <span className="font-bold text-purple-900">R$ {commissionValue.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-purple-600 pt-1">
                    💰 A barbearia arcará com este custo. Será lançado em Contas a Pagar.
                  </p>
                </div>
              ) : (
                <div className="bg-orange-100 rounded-lg p-3 text-xs text-orange-700">
                  ⚠️ Nenhuma comissão será gerada. O barbeiro <strong>não receberá</strong> por este atendimento.
                </div>
              )}
            </div>
          )}

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

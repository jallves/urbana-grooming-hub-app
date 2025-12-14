-- Tabela para armazenar pagamentos consolidados de comissões
CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commission_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'paid',
  notes TEXT,
  financial_record_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Masters and admins can manage commission payments"
  ON public.commission_payments
  FOR ALL
  USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Barbers can view their own commission payments"
  ON public.commission_payments
  FOR SELECT
  USING (barber_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- Índices para performance
CREATE INDEX idx_commission_payments_barber_id ON public.commission_payments(barber_id);
CREATE INDEX idx_commission_payments_payment_date ON public.commission_payments(payment_date);
CREATE INDEX idx_commission_payments_period ON public.commission_payments(period_start, period_end);

-- Trigger para updated_at
CREATE TRIGGER update_commission_payments_updated_at
  BEFORE UPDATE ON public.commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
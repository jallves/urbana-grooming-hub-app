-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.painel_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  categoria TEXT NOT NULL DEFAULT 'geral',
  imagens JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.painel_produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_active ON public.painel_produtos(is_active);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque ON public.painel_produtos(destaque);

-- Criar tabela de vendas de produtos (totem)
CREATE TABLE IF NOT EXISTS public.totem_product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.painel_clientes(id),
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pix_qr_code TEXT,
  pix_key TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de itens das vendas
CREATE TABLE IF NOT EXISTS public.totem_product_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.totem_product_sales(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.painel_produtos(id),
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies para produtos
ALTER TABLE public.painel_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar produtos ativos"
  ON public.painel_produtos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins podem gerenciar produtos"
  ON public.painel_produtos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies para vendas de produtos
ALTER TABLE public.totem_product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem ver suas vendas"
  ON public.totem_product_sales FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "Sistema pode criar vendas"
  ON public.totem_product_sales FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar vendas"
  ON public.totem_product_sales FOR UPDATE
  USING (true);

CREATE POLICY "Admins podem ver todas vendas"
  ON public.totem_product_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies para itens de venda
ALTER TABLE public.totem_product_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Público pode ver itens de venda"
  ON public.totem_product_sale_items FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode criar itens"
  ON public.totem_product_sale_items FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar estoque após venda
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.painel_produtos
  SET estoque = estoque - NEW.quantidade,
      updated_at = now()
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON public.totem_product_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Trigger para atualizar updated_at em produtos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_painel_produtos_updated_at
  BEFORE UPDATE ON public.painel_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
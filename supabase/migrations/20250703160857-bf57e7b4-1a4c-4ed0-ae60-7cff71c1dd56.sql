
-- Criar tabela de clientes do painel
CREATE TABLE public.painel_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de barbeiros para o painel
CREATE TABLE public.painel_barbeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços para o painel
CREATE TABLE public.painel_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao INTEGER NOT NULL, -- em minutos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de agendamentos do painel
CREATE TABLE public.painel_agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.painel_clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES public.painel_barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.painel_servicos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barbeiro_id, data, hora)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.painel_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para painel_clientes
CREATE POLICY "Clients can register" ON public.painel_clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clients can view own data" ON public.painel_clientes
  FOR SELECT USING (true);

CREATE POLICY "Clients can update own data" ON public.painel_clientes
  FOR UPDATE USING (true);

-- Políticas RLS para painel_barbeiros
CREATE POLICY "Anyone can view barbers" ON public.painel_barbeiros
  FOR SELECT USING (true);

-- Políticas RLS para painel_servicos
CREATE POLICY "Anyone can view services" ON public.painel_servicos
  FOR SELECT USING (true);

-- Políticas RLS para painel_agendamentos
CREATE POLICY "Clients can create appointments" ON public.painel_agendamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clients can view own appointments" ON public.painel_agendamentos
  FOR SELECT USING (true);

CREATE POLICY "Clients can update own appointments" ON public.painel_agendamentos
  FOR UPDATE USING (true);

-- Inserir dados de exemplo
INSERT INTO public.painel_barbeiros (nome) VALUES 
  ('João Silva'),
  ('Pedro Santos'),
  ('Carlos Oliveira');

INSERT INTO public.painel_servicos (nome, preco, duracao) VALUES 
  ('Corte Simples', 25.00, 30),
  ('Corte + Barba', 35.00, 45),
  ('Corte + Barba + Bigode', 45.00, 60),
  ('Apenas Barba', 15.00, 20),
  ('Corte Degradê', 30.00, 40);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_painel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_painel_clientes_updated_at
    BEFORE UPDATE ON public.painel_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_painel_updated_at();

CREATE TRIGGER update_painel_barbeiros_updated_at
    BEFORE UPDATE ON public.painel_barbeiros
    FOR EACH ROW
    EXECUTE FUNCTION update_painel_updated_at();

CREATE TRIGGER update_painel_servicos_updated_at
    BEFORE UPDATE ON public.painel_servicos
    FOR EACH ROW
    EXECUTE FUNCTION update_painel_updated_at();

CREATE TRIGGER update_painel_agendamentos_updated_at
    BEFORE UPDATE ON public.painel_agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_painel_updated_at();


-- Criar tabela painel_clientes se não existir
CREATE TABLE IF NOT EXISTS public.painel_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela painel_barbeiros se não existir
CREATE TABLE IF NOT EXISTS public.painel_barbeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela painel_servicos se não existir
CREATE TABLE IF NOT EXISTS public.painel_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL,
  duracao INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela painel_agendamentos se não existir
CREATE TABLE IF NOT EXISTS public.painel_agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.painel_clientes(id),
  barbeiro_id UUID NOT NULL REFERENCES public.painel_barbeiros(id),
  servico_id UUID NOT NULL REFERENCES public.painel_servicos(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para as tabelas
ALTER TABLE public.painel_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painel_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para painel_clientes
CREATE POLICY "Permitir inserção pública para painel_clientes" ON public.painel_clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Clientes podem ver seus próprios dados" ON public.painel_clientes
  FOR SELECT USING (true);

CREATE POLICY "Clientes podem atualizar seus próprios dados" ON public.painel_clientes
  FOR UPDATE USING (true);

-- Políticas para painel_barbeiros (leitura pública)
CREATE POLICY "Permitir leitura pública para painel_barbeiros" ON public.painel_barbeiros
  FOR SELECT USING (true);

-- Políticas para painel_servicos (leitura pública)
CREATE POLICY "Permitir leitura pública para painel_servicos" ON public.painel_servicos
  FOR SELECT USING (true);

-- Políticas para painel_agendamentos
CREATE POLICY "Permitir leitura para painel_agendamentos" ON public.painel_agendamentos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para painel_agendamentos" ON public.painel_agendamentos
  FOR INSERT WITH CHECK (true);

-- Inserir dados de exemplo para barbeiros
INSERT INTO public.painel_barbeiros (nome, email, telefone) VALUES
  ('João Silva', 'joao@barbearia.com', '(11) 99999-1111'),
  ('Pedro Santos', 'pedro@barbearia.com', '(11) 99999-2222'),
  ('Carlos Oliveira', 'carlos@barbearia.com', '(11) 99999-3333')
ON CONFLICT DO NOTHING;

-- Inserir dados de exemplo para serviços
INSERT INTO public.painel_servicos (nome, preco, duracao) VALUES
  ('Corte Masculino', 25.00, 30),
  ('Corte + Barba', 35.00, 45),
  ('Barba', 15.00, 20),
  ('Corte Infantil', 20.00, 25),
  ('Corte Premium', 45.00, 60)
ON CONFLICT DO NOTHING;

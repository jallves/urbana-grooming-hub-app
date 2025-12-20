-- Criar tabela de vínculo entre barbeiros (staff) e serviços
CREATE TABLE public.staff_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.painel_servicos(id) ON DELETE CASCADE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(staff_id, service_id)
);

-- Habilitar RLS
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Qualquer pessoa pode visualizar vínculos ativos"
ON public.staff_services
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar vínculos"
ON public.staff_services
FOR ALL
USING (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'master'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_staff_services_updated_at
BEFORE UPDATE ON public.staff_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir vínculos: todos os serviços ativos para todos os barbeiros ativos
INSERT INTO public.staff_services (staff_id, service_id, is_active)
SELECT 
    s.id as staff_id,
    ps.id as service_id,
    true as is_active
FROM public.staff s
CROSS JOIN public.painel_servicos ps
WHERE s.role = 'barber' 
  AND s.is_active = true 
  AND ps.is_active = true
ON CONFLICT (staff_id, service_id) DO NOTHING;
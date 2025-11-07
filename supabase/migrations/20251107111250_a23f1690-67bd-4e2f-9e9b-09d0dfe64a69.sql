-- Add show_on_home and display_order to services
ALTER TABLE painel_servicos 
ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create shop_settings table for general settings
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL DEFAULT 'Costa Urbana Barbearia',
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  website TEXT,
  social_instagram TEXT,
  social_facebook TEXT,
  social_twitter TEXT,
  hero_title TEXT DEFAULT 'Estilo e Tradição em Cada Corte',
  hero_subtitle TEXT DEFAULT 'A melhor experiência em barbearia clássica',
  about_title TEXT DEFAULT 'Sobre Nós',
  about_description TEXT DEFAULT 'Tradição e excelência em cada atendimento',
  footer_text TEXT DEFAULT 'Costa Urbana Barbearia - Todos os direitos reservados',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Policies for shop_settings (anyone can read, only authenticated users can update)
CREATE POLICY "Anyone can view shop settings"
  ON shop_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update shop settings"
  ON shop_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert shop settings"
  ON shop_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings if table is empty
INSERT INTO shop_settings (shop_name, phone, address)
SELECT 'Costa Urbana Barbearia', '(11) 99999-9999', 'São Paulo, SP'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings);

-- Add updated_at trigger
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create appointment_ratings table if not exists
CREATE TABLE IF NOT EXISTS public.appointment_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  client_id UUID NOT NULL,
  barber_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointment_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_ratings
-- Allow anyone to read ratings (public)
CREATE POLICY "Qualquer pessoa pode ver avaliações" 
ON public.appointment_ratings 
FOR SELECT 
USING (true);

-- Allow insert for anyone (totem public usage)
CREATE POLICY "Qualquer pessoa pode criar avaliação" 
ON public.appointment_ratings 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_barber_id ON public.appointment_ratings(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_client_id ON public.appointment_ratings(client_id);
CREATE INDEX IF NOT EXISTS idx_appointment_ratings_created_at ON public.appointment_ratings(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_appointment_ratings_updated_at ON public.appointment_ratings;
CREATE TRIGGER update_appointment_ratings_updated_at
BEFORE UPDATE ON public.appointment_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime support
ALTER TABLE public.appointment_ratings REPLICA IDENTITY FULL;
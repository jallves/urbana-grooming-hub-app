
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBarberAuth } from '@/hooks/useBarberAuth';

interface BarberProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  specialties?: string;
  experience?: string;
  commission_rate?: number;
}

export default function BarberProfileForm() {
  const { barber } = useBarberAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    experience: '',
    specialties: '',
    commission_rate: 0,
  });

  useEffect(() => {
    if (barber?.id) {
      loadProfile();
    }
  }, [barber]);

  const loadProfile = async () => {
    if (!barber?.id) return;

    try {
      // Fetch barber profile from barbers table
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', barber.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          experience: data.experience || '',
          specialties: data.specialties || '',
          commission_rate: data.commission_rate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('barbers')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          experience: formData.experience,
          specialties: formData.specialties,
          commission_rate: formData.commission_rate,
        })
        .eq('id', barber.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!barber) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Barbeiro</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e profissionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="experience">Experiência</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Descreva sua experiência profissional"
              />
            </div>
            
            <div>
              <Label htmlFor="specialties">Especialidades</Label>
              <Textarea
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="Liste suas especialidades (ex: cortes masculinos, barba, penteados)"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

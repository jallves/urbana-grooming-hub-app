
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
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', barber.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        const staffData = data as any;
        setProfile({
          id: staffData.id,
          name: staffData.name || '',
          email: staffData.email || '',
          phone: staffData.phone || '',
          image_url: staffData.image_url || '',
          specialties: staffData.specialties || '',
          experience: staffData.experience || '',
          commission_rate: staffData.commission_rate || 0,
        });
        setFormData({
          name: staffData.name || '',
          phone: staffData.phone || '',
          email: staffData.email || '',
          experience: staffData.experience || '',
          specialties: staffData.specialties || '',
          commission_rate: staffData.commission_rate || 0,
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
        .from('staff')
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

      loadProfile();
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
    return (
      <div className="text-center py-12">
        <div className="text-red-400">Acesso negado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Perfil do Barbeiro</CardTitle>
          <CardDescription className="text-gray-400">
            Gerencie suas informações pessoais e profissionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-white">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-white">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
                />
              </div>
              <div>
                <Label htmlFor="commission_rate" className="text-white">Taxa de Comissão (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: Number(e.target.value) }))}
                  className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="experience" className="text-white">Experiência</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Descreva sua experiência profissional"
                className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
              />
            </div>
            
            <div>
              <Label htmlFor="specialties" className="text-white">Especialidades</Label>
              <Textarea
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="Liste suas especialidades (ex: cortes masculinos, barba, penteados)"
                className="bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-urbana-gold"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

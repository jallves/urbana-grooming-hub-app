
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBarberAuth } from '@/hooks/useBarberAuth';
import { User, Mail, Phone, Award, Briefcase, Percent } from 'lucide-react';

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
          // commission_rate removido - apenas admin pode alterar
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
      {/* Header Card */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-urbana-gold" />
            Perfil do Barbeiro
          </CardTitle>
          <CardDescription className="text-gray-400">
            Gerencie suas informações pessoais e profissionais
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-urbana-gold" />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission_rate" className="text-white flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-400" />
                    Taxa de Comissão (%)
                  </Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    value={formData.commission_rate}
                    disabled
                    className="bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
                    min="0"
                    max="100"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-400">
                    * Apenas o administrador pode alterar a taxa de comissão
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-urbana-gold" />
                Informações Profissionais
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    Experiência Profissional
                  </Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Descreva sua experiência profissional, formação e trajetória na área"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialties" className="text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    Especialidades
                  </Label>
                  <Textarea
                    id="specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                    placeholder="Liste suas especialidades (ex: cortes masculinos, barba, penteados, coloração)"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-urbana-gold min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700/50">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-medium px-8"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

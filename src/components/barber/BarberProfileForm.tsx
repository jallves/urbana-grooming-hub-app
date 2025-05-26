
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { useImageUpload } from '@/components/admin/settings/media/useImageUpload';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido'),
  experience: z.string().optional(),
  specialties: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const BarberProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const { uploadFile, uploading } = useImageUpload();
  
  // Form for profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: user?.email || '',
      experience: '',
      specialties: '',
      commission_rate: 0
    }
  });
  
  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (error) {
          console.error('Erro ao buscar dados do perfil:', error);
          return;
        }
        
        if (data) {
          // Set form values from fetched data
          form.reset({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || user.email || '',
            experience: data.experience || '',
            specialties: data.specialties || '',
            commission_rate: data.commission_rate || 0
          });
          
          // Set image URL if available
          if (data.image_url) {
            setImageUrl(data.image_url);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
      }
    };
    
    fetchProfile();
  }, [user, form]);
  
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('staff')
        .update({
          name: values.name,
          phone: values.phone,
          email: values.email,
          experience: values.experience,
          specialties: values.specialties,
          commission_rate: values.commission_rate
        })
        .eq('email', user.email);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao atualizar seu perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !user?.email) {
      return;
    }
    
    const file = e.target.files[0];
    
    try {
      console.log('Fazendo upload da imagem do barbeiro...');
      
      // Upload the file using the centralized upload system
      const uploadedUrl = await uploadFile(file, 'staff-photos', 'profiles');
      
      if (uploadedUrl) {
        console.log('URL da imagem:', uploadedUrl);
        
        // Update the staff record with the new image URL
        const { error: updateError } = await supabase
          .from('staff')
          .update({ image_url: uploadedUrl })
          .eq('email', user.email);
        
        if (updateError) {
          throw updateError;
        }
        
        // Update the state with the new image URL
        setImageUrl(uploadedUrl);
        
        toast({
          title: 'Imagem atualizada',
          description: 'Sua foto de perfil foi atualizada com sucesso.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro ao atualizar imagem',
        description: error.message || 'Ocorreu um erro ao fazer upload da sua foto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={imageUrl || ''} />
            <AvatarFallback className="bg-zinc-800 text-white text-2xl">
              {form.getValues('name')?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <label 
            htmlFor="profileImage"
            className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors"
          >
            <Camera className="h-4 w-4 text-white" />
            <input 
              type="file" 
              id="profileImage" 
              accept="image/*" 
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>
        
        {uploading && <p className="text-sm text-gray-400">Atualizando imagem...</p>}
      </div>
      
      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de comissão (%)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.01"
                      disabled={true} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidades</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ex: cortes masculinos, barba, etc." 
                    disabled={loading}
                    className="resize-none"
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experiência</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Descreva sua experiência profissional" 
                    disabled={loading}
                    className="resize-none"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BarberProfileForm;

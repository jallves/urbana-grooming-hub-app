import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useStaffForm } from './hooks/useStaffForm';
import StaffProfileImage from './components/StaffProfileImage';
import StaffPersonalInfo from './components/StaffPersonalInfo';
import StaffProfessionalInfo from './components/StaffProfessionalInfo';
import StaffActiveStatus from './components/StaffActiveStatus';
import { StaffModuleAccess } from './components/StaffModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffFormProps {
  staffId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
  defaultRole?: string;
}

const StaffForm: React.FC<StaffFormProps> = ({ staffId, onCancel, onSuccess, defaultRole }) => {
  const {
    form,
    onSubmit: originalOnSubmit,
    isEditing,
    isLoadingStaff,
    handleFileChange,
    selectedFile,
    uploading,
    uploadProgress,
    isSubmitting
  } = useStaffForm(staffId, onSuccess, defaultRole);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  // NOVO: Estado local para controlar o valor do cargo se necessário
  // Remove após garantir que o campo do form funcione direito

  useEffect(() => {
    if (staffId) {
      // Carregamento já tratado no hook
    } else if (defaultRole && !staffId) {
      form.setValue('role', defaultRole);
    }
  }, [staffId, defaultRole, form]);

  // Função para enviar imagem e aguardar upload antes de chamar onSubmit do hook
  const handleSubmit = async (data: any) => {
    console.log('[DEBUG] Submit chamado. Dados recebidos:', data);
    try {
      if (!data.name || data.name.trim().length < 3) {
        toast.error('Nome é obrigatório e deve ter pelo menos 3 caracteres');
        console.log('[DEBUG] Falhou: nome inválido');
        return;
      }
      if (!data.role || data.role.trim() === '') {
        toast.error('Selecione um cargo para o profissional');
        console.log('[DEBUG] Falhou: cargo não selecionado');
        return;
      }

      // -- UPLOAD DE IMAGEM: se arquivo foi selecionado, faz upload e atualiza no form --
      if (selectedFile) {
        // useImageUpload retorna uploading true durante upload
        try {
          toast.info('Enviando foto...');
          const { uploadFile } = await import('@/components/admin/settings/media/useImageUpload');
          const url = await uploadFile(selectedFile, 'staff-photos', 'profiles');
          if (url) {
            data.image_url = url;
            form.setValue('image_url', url);
            toast.success('Imagem enviada com sucesso!');
          }
        } catch (err: any) {
          console.error('[DEBUG] Falha ao fazer upload da imagem:', err);
          toast.error('Falha ao enviar imagem', { description: err?.message });
          return; // Não prossegue
        }
      }

      // Cadastro Auth se email/senha definidos e não for edição
      if (!isEditing && data.email && password) {
        if (password !== confirmPassword) {
          toast.error('As senhas não correspondem');
          console.log('[DEBUG] Falhou: senhas não conferem');
          return;
        }
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          console.log('[DEBUG] Falhou: senha curta');
          return;
        }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password,
          options: {
            data: {
              full_name: data.name,
            },
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });
        if (signUpError) {
          toast.error('Erro ao criar conta de usuário', {
            description: signUpError.message
          });
          console.log('[DEBUG] Erro no signUp:', signUpError);
          return;
        } else if (signUpData.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: signUpData.user.id,
              role: data.role ?? 'attendant'
            }]);
          if (roleError) {
            toast.error('Erro ao adicionar role', { description: roleError.message });
            console.log('[DEBUG] Erro ao inserir role:', roleError);
            return;
          } else {
            toast.success('Conta criada e permissão atribuída');
          }
        }
      }

      // Submit final dos dados
      await originalOnSubmit({ ...data });

      toast.success("Profissional salvo com sucesso!");
      console.log('[DEBUG] Cadastro/atualização finalizado');
      onSuccess();
    } catch (error: any) {
      let desc = error?.message ? String(error.message) : 'Erro desconhecido';
      toast.error('Erro ao salvar profissional', { description: desc });
      console.error('[DEBUG] Erro inesperado no submit:', error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Informações Profissionais
            </TabsTrigger>
            {!staffId && (
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Conta de Acesso
              </TabsTrigger>
            )}
            {staffId && (
              <TabsTrigger value="access" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões de Acesso
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <StaffProfileImage
                  form={form}
                  handleFileChange={handleFileChange}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <StaffPersonalInfo form={form} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <StaffProfessionalInfo form={form} />
            <StaffActiveStatus form={form} />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Criação de Conta de Acesso
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Essas credenciais permitirão que o profissional acesse o painel administrativo.
                A senha deve ter pelo menos 6 caracteres.
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite uma senha"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirmar Senha
                  </label>
                  <Input
                    id="confirm-password"
                    type={passwordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a senha"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-password"
                    checked={passwordVisible}
                    onChange={() => setPasswordVisible(!passwordVisible)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="show-password" className="text-sm">
                    Mostrar senha
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
          {staffId && (
            <TabsContent value="access" className="space-y-6">
              <StaffModuleAccess staffId={staffId} onSuccess={() => { }} />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : staffId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;

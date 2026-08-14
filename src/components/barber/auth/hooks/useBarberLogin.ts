
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { signInWithMatricula } from '@/lib/staffLogin';

const barberLoginSchema = z.object({
  matricula: z.string().min(1, 'Informe sua matrícula'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type BarberLoginForm = z.infer<typeof barberLoginSchema>;

interface UseBarberLoginProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess: (userId: string) => void;
}

export const useBarberLogin = ({ loading, setLoading, onLoginSuccess }: UseBarberLoginProps) => {
  const { toast } = useToast();

  const form = useForm<BarberLoginForm>({
    resolver: zodResolver(barberLoginSchema),
    defaultValues: {
      matricula: '',
      password: '',
    },
  });

  const onSubmit = async (data: BarberLoginForm) => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await signInWithMatricula(data.matricula, data.password);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel do barbeiro!",
      });

      onLoginSuccess(result.userId);
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error?.message || "Matrícula ou senha incorretos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    onSubmit,
  };
};

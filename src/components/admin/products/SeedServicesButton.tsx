import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Database, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SeedServicesButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const seedServices = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Iniciando seed de serviços...');
      
      const { data, error } = await supabase.functions.invoke('seed-services', {
        body: {},
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar serviços');
      }

      console.log('✅ Seed de serviços concluído:', data);

      // Mostrar logs no console
      if (data.logs && Array.isArray(data.logs)) {
        console.log('\n📋 LOGS DO SEED:');
        data.logs.forEach((log: string) => console.log(log));
      }

      toast.success('Serviços cadastrados com sucesso!', {
        description: `
          ✅ ${data.data?.servicesRemoved || 0} serviços removidos
          ✅ ${data.data?.servicesInserted || 0} serviços inseridos
          ✅ ${data.data?.homeServices?.length || 0} visíveis na Home
        `,
        duration: 6000,
      });

      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao executar seed:', error);
      toast.error('Erro ao cadastrar serviços', {
        description: error.message || 'Erro desconhecido',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          disabled={isLoading}
          variant="outline"
          className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              Seed Serviços Oficiais
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            Seed de Serviços - Barbearia Costa Urbana
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação irá <strong className="text-red-600">remover todos os serviços existentes</strong> e 
              inserir a lista oficial de 34 serviços da barbearia.
            </p>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-2">O que será feito:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Remover serviços antigos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Inserir 34 serviços oficiais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Configurar 6 serviços para aparecer na Home
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Vincular todos os serviços aos barbeiros
                </li>
              </ul>
            </div>
            <p className="text-amber-600 font-medium">
              ⚠️ Esta ação é irreversível. Deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={seedServices}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Executar Seed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeedServicesButton;

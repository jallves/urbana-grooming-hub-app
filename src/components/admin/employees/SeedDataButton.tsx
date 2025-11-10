import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

const SeedDataButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const seedInitialData = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Chamando edge function para criar dados de teste...');
      
      const { data, error } = await supabase.functions.invoke('seed-test-data', {
        body: {},
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar dados');
      }

      console.log('✅ Dados criados com sucesso:', data);

      toast.success('Dados de teste criados com sucesso!', {
        description: `
          ✅ Cliente: João Silva (joao.silva@example.com)
          ✅ Serviço: Corte Premium (R$ 50,00)
          ✅ Produto: Pomada Modeladora (R$ 35,00)
          ✅ Funcionário: Carlos Barbosa (Barbeiro)
        `,
        duration: 6000,
      });

    } catch (error: any) {
      console.error('💥 Erro ao criar dados iniciais:', error);
      toast.error('Erro ao criar dados de teste', {
        description: error.message || 'Erro desconhecido',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={seedInitialData}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Criando cadastros...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Criar Cadastros Iniciais
        </>
      )}
    </Button>
  );
};

export default SeedDataButton;

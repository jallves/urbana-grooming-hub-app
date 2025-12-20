import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Package, CheckCircle } from 'lucide-react';
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

const SeedProductsButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const seedProducts = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Iniciando seed de produtos...');
      
      const { data, error } = await supabase.functions.invoke('seed-products', {
        body: {},
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar produtos');
      }

      console.log('✅ Seed de produtos concluído:', data);

      // Mostrar logs no console
      if (data.logs && Array.isArray(data.logs)) {
        console.log('\n📋 LOGS DO SEED:');
        data.logs.forEach((log: string) => console.log(log));
      }

      toast.success('Produtos cadastrados com sucesso!', {
        description: `
          ✅ ${data.data?.productsRemoved || 0} produtos removidos
          ✅ ${data.data?.productsInserted || 0} produtos inseridos
          ✅ 100 unidades de cada produto
        `,
        duration: 6000,
      });

      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('💥 Erro ao executar seed:', error);
      toast.error('Erro ao cadastrar produtos', {
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
          className="gap-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Seed Produtos
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-500" />
            Seed de Produtos - Barbearia Costa Urbana
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação irá <strong className="text-red-600">remover todos os produtos existentes</strong> e 
              inserir os 6 produtos mais vendidos em barbearias.
            </p>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-2">Produtos que serão inseridos:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Pomada Modeladora Premium - R$ 45,00
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Óleo para Barba - R$ 55,00
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Pós-Barba Hidratante - R$ 38,00
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Shampoo Cabelo e Barba - R$ 42,00
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cera Capilar Matte - R$ 48,00
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Balm para Barba - R$ 52,00
                </li>
              </ul>
              <p className="mt-2 text-xs">Todos com 100 unidades em estoque</p>
            </div>
            <p className="text-amber-600 font-medium">
              ⚠️ Esta ação é irreversível. Deseja continuar?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={seedProducts}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Executar Seed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeedProductsButton;

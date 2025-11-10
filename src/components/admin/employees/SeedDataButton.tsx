import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import bcrypt from 'bcryptjs';

const SeedDataButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const seedInitialData = async () => {
    setIsLoading(true);
    
    try {
      // 1. Criar Cliente
      const clientPassword = await bcrypt.hash('cliente123', 10);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: 'João Silva',
          email: 'joao.silva@example.com',
          phone: '(11) 98765-4321',
          whatsapp: '(11) 98765-4321',
          birth_date: '1990-05-15',
          password_hash: clientPassword
        })
        .select()
        .single();

      if (clientError) throw new Error(`Erro ao criar cliente: ${clientError.message}`);
      
      // 2. Criar Serviço
      const { data: service, error: serviceError } = await supabase
        .from('painel_servicos')
        .insert({
          nome: 'Corte Premium',
          descricao: 'Corte de cabelo premium com acabamento refinado',
          preco: 50.00,
          duracao: 45,
          is_active: true,
          show_on_home: true
        })
        .select()
        .single();

      if (serviceError) throw new Error(`Erro ao criar serviço: ${serviceError.message}`);

      // 3. Criar Produto
      const { data: product, error: productError } = await supabase
        .from('painel_produtos')
        .insert({
          nome: 'Pomada Modeladora',
          descricao: 'Pomada profissional para modelagem e fixação',
          preco: 35.00,
          estoque: 50,
          estoque_minimo: 10,
          categoria: 'Finalizadores',
          is_active: true,
          destaque: true
        })
        .select()
        .single();

      if (productError) throw new Error(`Erro ao criar produto: ${productError.message}`);

      // 4. Criar Funcionário Barbeiro
      const employeePassword = await bcrypt.hash('barbeiro123', 10);
      
      // Primeiro cria na tabela employees
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          name: 'Carlos Barbosa',
          email: 'carlos.barbosa@barbershop.com',
          phone: '(11) 99876-5432',
          role: 'barber',
          status: 'active',
          commission_rate: 40.00,
          photo_url: null
        })
        .select()
        .single();

      if (employeeError) throw new Error(`Erro ao criar funcionário: ${employeeError.message}`);

      // Depois cria na tabela staff (para barbeiros)
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          name: 'Carlos Barbosa',
          email: 'carlos.barbosa@barbershop.com',
          phone: '(11) 99876-5432',
          specialties: 'Cortes clássicos, Barbas, Degradês',
          experience: '5 anos',
          commission_rate: 40.00,
          role: 'barber',
          is_active: true
        });

      if (staffError) throw new Error(`Erro ao migrar barbeiro para staff: ${staffError.message}`);

      toast.success('Dados iniciais criados com sucesso!', {
        description: `
          ✅ Cliente: João Silva
          ✅ Serviço: Corte Premium
          ✅ Produto: Pomada Modeladora
          ✅ Funcionário: Carlos Barbosa (Barbeiro)
        `,
        duration: 5000,
      });

    } catch (error: any) {
      console.error('Erro ao criar dados iniciais:', error);
      toast.error('Erro ao criar dados iniciais', {
        description: error.message,
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

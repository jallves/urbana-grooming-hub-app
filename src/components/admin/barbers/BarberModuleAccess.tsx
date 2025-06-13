
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BarberModuleAccessProps {
  barberId: string;
  onSuccess?: () => void;
}

// Define available modules específicos para barbeiros
const availableModules = [
  { id: 'appointments', name: 'Agendamentos', description: 'Gestão de horários e agendamentos' },
  { id: 'clients', name: 'Clientes', description: 'Cadastro e gestão de clientes' },
  { id: 'services', name: 'Serviços', description: 'Visualização dos serviços oferecidos' },
  { id: 'reports', name: 'Relatórios', description: 'Relatórios financeiros e de desempenho' }
];

export function BarberModuleAccess({ barberId, onSuccess }: BarberModuleAccessProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current module access
  useEffect(() => {
    const fetchModuleAccess = async () => {
      if (!barberId) return;
      
      setLoading(true);
      try {
        console.log("Fetching module access for barber ID:", barberId);
        
        const { data, error } = await supabase
          .from('staff_module_access')
          .select('module_id')
          .eq('staff_id', barberId);
        
        if (error) {
          console.error('Error loading module access:', error);
          toast({
            title: "Erro ao carregar permissões",
            description: "Não foi possível carregar as permissões de acesso",
            variant: "destructive"
          });
        } else {
          console.log("Module access data received:", data);
          const modules = data?.map(item => item.module_id) || [];
          setSelectedModules(modules);
        }
      } catch (error) {
        console.error('Error in fetchModuleAccess:', error);
        toast({
          title: "Erro ao carregar permissões",
          description: "Ocorreu um erro ao buscar as permissões de acesso",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModuleAccess();
  }, [barberId]);

  // Handle module selection
  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  // Save module access
  const saveModuleAccess = async () => {
    if (!barberId) return;
    
    setSaving(true);
    try {
      console.log("Saving module access for barber ID:", barberId, "modules:", selectedModules);
      
      // Delete existing access first
      const { error: deleteError } = await supabase
        .from('staff_module_access')
        .delete()
        .eq('staff_id', barberId);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Insert new access if there are selected modules
      if (selectedModules.length > 0) {
        const accessData = selectedModules.map(moduleId => ({
          staff_id: barberId,
          module_id: moduleId
        }));
        
        const { error: insertError } = await supabase
          .from('staff_module_access')
          .insert(accessData);
          
        if (insertError) {
          throw insertError;
        }
      }
      
      toast({
        title: "Permissões atualizadas",
        description: "As permissões de acesso foram atualizadas com sucesso",
        variant: "default"
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error in saveModuleAccess:', error);
      toast({
        title: "Erro ao salvar permissões",
        description: "Ocorreu um erro ao atualizar as permissões de acesso",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões de Acesso</CardTitle>
        <CardDescription>
          Configure a quais módulos este barbeiro terá acesso no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableModules.map((module) => (
            <div key={module.id} className="flex items-start space-x-3 p-3 border rounded-md">
              <Checkbox
                id={`module-${module.id}`}
                checked={selectedModules.includes(module.id)}
                onCheckedChange={() => toggleModule(module.id)}
              />
              <div className="grid gap-1.5">
                <label
                  htmlFor={`module-${module.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {module.name}
                </label>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          ))}
          
          <div className="flex items-center pt-4">
            <Button onClick={saveModuleAccess} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

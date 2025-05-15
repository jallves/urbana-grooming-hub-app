
import React, { useState, useEffect } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { supabaseRPC } from '@/types/supabase-rpc';

interface StaffModuleAccessProps {
  staffId: string;
  onSuccess?: () => void;
}

// Define available modules
const availableModules = [
  { id: 'appointments', name: 'Agendamentos', description: 'Gestão de horários e agendamentos' },
  { id: 'clients', name: 'Clientes', description: 'Cadastro e gestão de clientes' },
  { id: 'services', name: 'Serviços', description: 'Gestão de serviços oferecidos' },
  { id: 'products', name: 'Produtos', description: 'Gestão de produtos e estoque' },
  { id: 'finance', name: 'Financeiro', description: 'Controle financeiro e pagamentos' },
  { id: 'reports', name: 'Relatórios', description: 'Relatórios e análises' },
  { id: 'marketing', name: 'Marketing', description: 'Gestão de campanhas e promoções' }
];

export function StaffModuleAccess({ staffId, onSuccess }: StaffModuleAccessProps) {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load current module access
  useEffect(() => {
    const fetchModuleAccess = async () => {
      if (!staffId) return;
      
      setLoading(true);
      try {
        console.log("Fetching module access for staff ID:", staffId);
        const response = await supabaseRPC.getStaffModuleAccess(staffId);
        
        if (response.error) {
          console.error('Error loading module access:', response.error);
          toast({
            title: "Erro ao carregar permissões",
            description: "Não foi possível carregar as permissões de acesso",
            variant: "destructive"
          });
        } else {
          console.log("Module access data received:", response.data);
          setSelectedModules(response.data || []);
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
        setInitialLoaded(true);
      }
    };

    fetchModuleAccess();
  }, [staffId]);

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
    if (!staffId) return;
    
    setSaving(true);
    try {
      console.log("Saving module access for staff ID:", staffId, "modules:", selectedModules);
      const response = await supabaseRPC.updateStaffModuleAccess(staffId, selectedModules);
      
      if (response.error) {
        console.error('Error saving module access:', response.error);
        toast({
          title: "Erro ao salvar permissões",
          description: "Não foi possível atualizar as permissões de acesso",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Permissões atualizadas",
          description: "As permissões de acesso foram atualizadas com sucesso",
          variant: "default"
        });
        if (onSuccess) onSuccess();
      }
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

  if (loading && !initialLoaded) {
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
          Configure a quais módulos este profissional terá acesso no sistema
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

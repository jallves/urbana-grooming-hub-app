
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save } from 'lucide-react';
import { supabaseRPC, GetStaffModuleAccessResponse, UpdateStaffModuleAccessResponse } from '@/types/supabase-rpc';

interface GetStaffModuleAccessResponse {
  data: string[] | null;
  error: Error | null;
}

interface UpdateStaffModuleAccessResponse {
  data: null;
  error: Error | null;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface StaffModuleAccessProps {
  staffId: string;
}

// Define available modules
const modules: Module[] = [
  {
    id: 'appointments',
    name: 'Agendamentos',
    description: 'Visualização e gerenciamento de agendamentos',
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
  },
  {
    id: 'clients',
    name: 'Clientes',
    description: 'Acesso aos dados de clientes',
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
  },
  {
    id: 'services',
    name: 'Serviços',
    description: 'Visualização de serviços disponíveis',
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Acesso a relatórios de desempenho e comissões',
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
  },
];

export const StaffModuleAccess: React.FC<StaffModuleAccessProps> = ({ staffId }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchModuleAccess = async () => {
      try {
        setLoading(true);
        // Using our type-safe RPC function wrapper
        const { data, error } = await supabaseRPC.getStaffModuleAccess(staffId);
        
        if (error) {
          console.error('Error fetching module access:', error);
          toast({
            title: 'Erro ao carregar permissões',
            description: 'Não foi possível carregar as permissões de módulos.',
            variant: 'destructive',
          });
        } else if (data) {
          setSelectedModules(data);
        }
      } catch (error) {
        console.error('Error in fetching module access:', error);
        toast({
          title: 'Erro inesperado',
          description: 'Ocorreu um erro ao carregar os dados.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchModuleAccess();
    }
  }, [staffId, toast]);

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleSaveAccess = async () => {
    if (!staffId) return;
    
    try {
      setSaving(true);
      
      // Using our type-safe RPC function wrapper
      const { error } = await supabaseRPC.updateStaffModuleAccess(staffId, selectedModules);
      
      if (error) {
        console.error('Error saving module access:', error);
        toast({
          title: 'Erro ao salvar permissões',
          description: 'Não foi possível atualizar as permissões de módulos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Permissões atualizadas',
          description: 'As permissões de acesso foram atualizadas com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error in saving module access:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao salvar as permissões.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Acesso aos Módulos</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSaveAccess} 
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        {modules.map(module => (
          <div key={module.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent">
            <Checkbox 
              id={`module-${module.id}`}
              checked={selectedModules.includes(module.id)}
              onCheckedChange={() => handleModuleToggle(module.id)}
            />
            <div className="grid gap-1">
              <label
                htmlFor={`module-${module.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                {module.name}
                <Badge variant="outline" className="ml-2">
                  {module.icon} Módulo
                </Badge>
              </label>
              <p className="text-sm text-muted-foreground">
                {module.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

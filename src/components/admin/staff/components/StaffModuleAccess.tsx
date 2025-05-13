
import React, { useState, useEffect } from 'react';
import { Check, Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface StaffModuleAccessProps {
  staffId: string;
  onSuccess?: () => void;
}

const StaffModuleAccess: React.FC<StaffModuleAccessProps> = ({ staffId, onSuccess }) => {
  const [modules, setModules] = useState<Module[]>([
    { 
      id: 'appointments', 
      name: 'Agendamentos', 
      description: 'Gerenciar agendamentos e calendário',
      icon: <Check className="h-4 w-4" />
    },
    { 
      id: 'clients', 
      name: 'Clientes', 
      description: 'Visualizar e gerenciar clientes',
      icon: <Shield className="h-4 w-4" />
    },
    { 
      id: 'services', 
      name: 'Serviços', 
      description: 'Gerenciar serviços oferecidos',
      icon: <Lock className="h-4 w-4" /> 
    },
    { 
      id: 'reports', 
      name: 'Relatórios', 
      description: 'Acesso a relatórios básicos',
      icon: <Shield className="h-4 w-4" />
    }
  ]);
  
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch existing modules access for the staff member
  useEffect(() => {
    const fetchModuleAccess = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('staff_module_access')
          .select('module_ids')
          .eq('staff_id', staffId)
          .single();
        
        if (error) {
          console.error('Error fetching module access:', error);
          return;
        }
        
        if (data && Array.isArray(data.module_ids)) {
          setSelectedModules(data.module_ids);
        }
      } catch (error) {
        console.error('Error in fetchModuleAccess:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (staffId) {
      fetchModuleAccess();
    }
  }, [staffId]);
  
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
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('staff_module_access')
        .upsert(
          { 
            staff_id: staffId, 
            module_ids: selectedModules,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'staff_id' }
        );
      
      if (error) {
        console.error('Error saving module access:', error);
        toast.error('Erro ao salvar permissões de acesso');
        return;
      }
      
      toast.success('Permissões de acesso atualizadas com sucesso');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error in handleSaveAccess:', error);
      toast.error('Erro ao salvar permissões de acesso');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Permissões de Acesso aos Módulos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {modules.map(module => (
                <div key={module.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50 transition-colors">
                  <Checkbox 
                    id={`module-${module.id}`}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleModuleToggle(module.id)}
                  />
                  <div>
                    <label 
                      htmlFor={`module-${module.id}`}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {module.icon}
                      {module.name}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={handleSaveAccess} 
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffModuleAccess;

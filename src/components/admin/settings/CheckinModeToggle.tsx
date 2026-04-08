import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { useCheckinHomologationMode } from '@/hooks/useCheckinHomologationMode';
import { toast } from 'sonner';

const CheckinModeToggle: React.FC = () => {
  const { isEnabled, loading, toggleSetting } = useCheckinHomologationMode();

  const handleToggle = async (checked: boolean) => {
    const success = await toggleSetting(checked);
    if (success) {
      toast.success(
        checked 
          ? '🔓 Check-in liberado! Sem restrição de horário.' 
          : '🔒 Check-in com regra de 90 minutos ativada.'
      );
    } else {
      toast.error('Erro ao alterar configuração');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isEnabled 
        ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-100' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <ShieldAlert className="h-6 w-6 text-amber-600" />
          ) : (
            <Shield className="h-6 w-6 text-gray-500" />
          )}
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">
              Modo Homologação — Check-in
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEnabled 
                ? '🔓 Check-in liberado sem restrição de horário (teste)' 
                : '🔒 Check-in restrito à janela de 90 min antes do agendamento'}
            </p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          className={isEnabled ? 'data-[state=checked]:bg-amber-500' : ''}
        />
      </div>
      {isEnabled && (
        <div className="mt-3 p-2 bg-amber-100 rounded-lg border border-amber-300">
          <p className="text-xs font-medium text-amber-800">
            ⚠️ Atenção: O check-in está liberado para qualquer horário. Desative após os testes.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckinModeToggle;

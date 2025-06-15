
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AppointmentActionButtonsProps {
  isEdit: boolean;
  loading: boolean;
  isSending: boolean;
  isValid: boolean;
}

export function AppointmentActionButtons({ isEdit, loading, isSending, isValid }: AppointmentActionButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6">
      <Button 
        type="button"
        variant="outline"
        onClick={() => navigate('/cliente/dashboard')}
        className="flex-1 bg-transparent border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 h-12"
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        className="flex-1 bg-gradient-to-r from-urbana-gold to-urbana-gold/90 hover:from-urbana-gold/90 hover:to-urbana-gold text-black font-semibold h-12 shadow-lg shadow-urbana-gold/25"
        disabled={loading || isSending || !isValid}
      >
        {loading || isSending ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
            {isEdit ? 'Atualizando...' : 'Agendando...'}
          </div>
        ) : (
          isEdit ? "Atualizar Agendamento" : "Confirmar Agendamento"
        )}
      </Button>
    </div>
  );
}

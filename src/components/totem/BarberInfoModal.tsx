import React from 'react';
import { X, Star, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Barber {
  id: string;
  nome: string;
  especialidade?: string;
  foto_url?: string;
  ativo: boolean;
}

interface BarberInfoModalProps {
  barber: Barber;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BarberInfoModal: React.FC<BarberInfoModalProps> = ({
  barber,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-urbana-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-urbana-brown/95 to-urbana-black/95 backdrop-blur-xl border-2 border-urbana-gold/50 rounded-3xl shadow-2xl shadow-urbana-gold/20 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-urbana-black/50 hover:bg-urbana-black/70 text-urbana-light hover:text-urbana-gold transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Barber Photo */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-urbana-gold shadow-lg shadow-urbana-gold/30">
                {barber.foto_url ? (
                  <img
                    src={barber.foto_url}
                    alt={barber.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-urbana-gold/30 to-urbana-gold-dark/30 flex items-center justify-center">
                    <Award className="w-16 h-16 text-urbana-gold" />
                  </div>
                )}
              </div>
              {/* Decorative Ring */}
              <div className="absolute -inset-2 rounded-full border-2 border-urbana-gold/30 animate-pulse" />
            </div>

            {/* Barber Name */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-urbana-gold drop-shadow-lg">
                {barber.nome}
              </h2>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-urbana-gold to-transparent" />
            </div>

            {/* Specialties */}
            {barber.especialidade && (
              <div className="bg-urbana-black/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-urbana-gold/20 w-full">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-urbana-gold fill-urbana-gold" />
                  <h3 className="text-lg font-semibold text-urbana-light">Especialidades</h3>
                  <Star className="w-5 h-5 text-urbana-gold fill-urbana-gold" />
                </div>
                <p className="text-base sm:text-lg text-urbana-light/80 leading-relaxed">
                  {barber.especialidade}
                </p>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="flex items-center gap-3 text-urbana-light/70 text-sm sm:text-base">
              <Calendar className="w-5 h-5 text-urbana-gold" />
              <p>Confirme para escolher este profissional</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full pt-4">
              <Button
                onClick={onCancel}
                variant="outline"
                size="lg"
                className="flex-1 h-14 sm:h-16 text-base sm:text-lg bg-urbana-black/50 border-2 border-urbana-gold/30 text-urbana-light hover:bg-urbana-black/70 hover:border-urbana-gold/50 transition-all"
              >
                Voltar
              </Button>
              <Button
                onClick={onConfirm}
                size="lg"
                className="flex-1 h-14 sm:h-16 text-base sm:text-lg bg-gradient-to-r from-urbana-gold-vibrant via-urbana-gold to-urbana-gold-light text-urbana-black font-bold hover:shadow-lg hover:shadow-urbana-gold/50 transition-all hover:scale-105"
              >
                Confirmar Escolha
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-urbana-gold/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-urbana-gold-vibrant/10 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  );
};


import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Calendar, Clock, User, Scissors, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ConfirmacaoAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'sucesso' | 'erro';
  titulo: string;
  mensagem: string;
  detalhesAgendamento?: {
    servico: string;
    barbeiro: string;
    data: string;
    hora: string;
    preco: number;
  };
}

export default function ConfirmacaoAgendamento({
  isOpen,
  onClose,
  tipo,
  titulo,
  mensagem,
  detalhesAgendamento
}: ConfirmacaoAgendamentoProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md mx-auto"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
              {/* Ícone */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="mb-4 sm:mb-6"
              >
                {tipo === 'sucesso' ? (
                  <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-75 animate-pulse" />
                    <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                      <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full blur-md opacity-75 animate-pulse" />
                    <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full">
                      <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Título */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 px-2"
              >
                {titulo}
              </motion.h2>

              {/* Mensagem */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed px-2"
              >
                {mensagem}
              </motion.p>

              {/* Detalhes do agendamento (apenas para sucesso) */}
              {tipo === 'sucesso' && detalhesAgendamento && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    Detalhes do Agendamento
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Scissors className="h-4 w-4 text-amber-500" />
                        <span>Serviço:</span>
                      </div>
                      <span className="text-white font-medium">{detalhesAgendamento.servico}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <User className="h-4 w-4 text-amber-500" />
                        <span>Barbeiro:</span>
                      </div>
                      <span className="text-white font-medium">{detalhesAgendamento.barbeiro}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <span>Data:</span>
                      </div>
                      <span className="text-white font-medium">{detalhesAgendamento.data}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Horário:</span>
                      </div>
                      <span className="text-white font-medium">{detalhesAgendamento.hora}</span>
                    </div>
                    
                    <div className="border-t border-slate-700/50 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Valor:</span>
                        <span className="text-amber-400 font-bold text-lg">
                          R$ {detalhesAgendamento.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Botão */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className={`w-full px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                    tipo === 'sucesso'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                  }`}
                >
                  {tipo === 'sucesso' ? 'Perfeito!' : 'Entendi'}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

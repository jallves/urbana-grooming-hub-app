
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface AppointmentSyncNotificationProps {
  status: 'confirmado' | 'concluido' | 'cancelado' | 'sincronizando' | null;
  clientName?: string;
  onClose?: () => void;
}

const AppointmentSyncNotification: React.FC<AppointmentSyncNotificationProps> = ({
  status,
  clientName,
  onClose
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'confirmado':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          title: 'Agendamento Confirmado',
          message: clientName ? `Agendamento de ${clientName} foi confirmado` : 'Agendamento confirmado'
        };
      case 'concluido':
        return {
          icon: CheckCircle,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          title: 'Agendamento Concluído',
          message: clientName ? `Atendimento de ${clientName} foi finalizado` : 'Atendimento finalizado'
        };
      case 'cancelado':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          title: 'Agendamento Cancelado',
          message: clientName ? `Agendamento de ${clientName} foi cancelado` : 'Agendamento cancelado'
        };
      case 'sincronizando':
        return {
          icon: RefreshCw,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          title: 'Sincronizando...',
          message: 'Atualizando em todos os painéis'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const { icon: Icon, color, bgColor, borderColor, title, message } = config;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed top-4 right-4 z-50 ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 max-w-sm`}
      >
        <div className="flex items-start gap-3">
          <div className={`${color} flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${status === 'sincronizando' ? 'animate-spin' : ''}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">{title}</p>
            <p className="text-gray-300 text-xs mt-1">{message}</p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="mt-2">
          <div className="text-xs text-gray-400">
            Sincronizado em tempo real
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AppointmentSyncNotification;

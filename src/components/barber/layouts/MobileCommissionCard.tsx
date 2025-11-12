
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Commission {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_date?: string;
  paid_at?: string;
  commission_rate?: number;
  appointment_details?: {
    client_name?: string;
    service_name?: string;
    service_price?: number;
    appointment_date?: string;
    appointment_time?: string;
  };
  source: string;
}

interface MobileCommissionCardProps {
  commission: Commission;
  getStatusBadge: (status: string) => React.ReactNode;
}

const MobileCommissionCard: React.FC<MobileCommissionCardProps> = ({
  commission,
  getStatusBadge
}) => {
  return (
    <Card className="w-full bg-urbana-black/40 backdrop-blur-2xl border border-urbana-gold/20 shadow-2xl shadow-urbana-black/50 mb-3">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-3">
              <h4 className="font-medium text-white text-sm truncate">
                {commission.appointment_details?.client_name || 'Cliente'}
              </h4>
              <p className="text-xs text-gray-400 truncate">
                {commission.appointment_details?.service_name || 'Serviço'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {commission.source === 'painel' ? 'Painel' : 'Sistema Novo'}
              </p>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(commission.status)}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400 mb-1">Data</p>
              <p className="text-white">
                {commission.appointment_details?.appointment_date
                  ? format(parseISO(commission.appointment_details.appointment_date), 'dd/MM', { locale: ptBR })
                  : format(parseISO(commission.created_at), 'dd/MM', { locale: ptBR })
                }
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Horário</p>
              <p className="text-white">
                {commission.appointment_details?.appointment_time || '--:--'}
              </p>
            </div>
            {commission.commission_rate && (
              <div>
                <p className="text-gray-400 mb-1">Taxa</p>
                <p className="text-urbana-gold font-medium">{commission.commission_rate}%</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 mb-1">Valor Serviço</p>
              <p className="text-white">
                R$ {(commission.appointment_details?.service_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Commission Amount */}
          <div className="pt-2 border-t border-urbana-gold/20">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Comissão</span>
              <span className="text-sm font-bold text-urbana-gold">
                R$ {commission.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          {(commission.payment_date || commission.paid_at) && (
            <div className="text-xs text-gray-400 pt-1">
              Pago em: {format(parseISO(commission.payment_date || commission.paid_at!), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCommissionCard;

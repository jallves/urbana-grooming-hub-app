import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, X, CreditCard, FileText, XCircle, AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TransactionData {
  operation: string;
  transactionResult: number;
  amount?: number;
  localNsu?: string;
  transactionNsu?: string;
  terminalNsu?: string;
  hostNsu?: string;
  authorizationCode?: string;
  merchantId?: string;
  providerName?: string;
  cardName?: string;
  resultMessage?: string;
  confirmationTransactionId?: string;
  requiresConfirmation?: boolean;
  merchantReceipt?: string;
  cardholderReceipt?: string;
}

interface TEFTransactionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionData | null;
  onPrintMerchant?: () => void;
  onPrintCustomer?: () => void;
}

const TEFTransactionSuccessModal: React.FC<TEFTransactionSuccessModalProps> = ({
  open,
  onClose,
  transaction,
  onPrintMerchant,
  onPrintCustomer
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  if (!transaction) return null;

  const isApproved = transaction.transactionResult === 0;
  const isPending = transaction.transactionResult === -2599;
  const isDenied = !isApproved && !isPending;

  const formatCurrency = (centavos: number) => {
    return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // O NSU Local é o campo principal para a planilha PayGo
  const nsuLocal = transaction.localNsu || transaction.terminalNsu || '';

  const handlePrintMerchant = () => {
    if (transaction.merchantReceipt) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Via Lojista</title>
              <style>
                body { font-family: monospace; font-size: 12px; padding: 20px; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h3>VIA LOJISTA</h3>
              <pre>${transaction.merchantReceipt}</pre>
              <script>window.print(); setTimeout(() => window.close(), 500);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    onPrintMerchant?.();
  };

  const handlePrintCustomer = () => {
    if (transaction.cardholderReceipt) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Via Cliente</title>
              <style>
                body { font-family: monospace; font-size: 12px; padding: 20px; }
                pre { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h3>VIA CLIENTE</h3>
              <pre>${transaction.cardholderReceipt}</pre>
              <script>window.print(); setTimeout(() => window.close(), 500);</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    onPrintCustomer?.();
  };

  const getStatusConfig = () => {
    if (isApproved) {
      return {
        icon: <CheckCircle className="w-8 h-8" />,
        title: 'TRANSAÇÃO APROVADA',
        titleColor: 'text-green-400',
        borderColor: 'border-green-500',
        bgColor: 'bg-green-900/50',
        valueBorderColor: 'border-green-600',
        valueTextColor: 'text-green-400'
      };
    }
    if (isPending) {
      return {
        icon: <AlertTriangle className="w-8 h-8" />,
        title: 'PENDÊNCIA DETECTADA',
        titleColor: 'text-yellow-400',
        borderColor: 'border-yellow-500',
        bgColor: 'bg-yellow-900/50',
        valueBorderColor: 'border-yellow-600',
        valueTextColor: 'text-yellow-400'
      };
    }
    return {
      icon: <XCircle className="w-8 h-8" />,
      title: 'TRANSAÇÃO NEGADA',
      titleColor: 'text-red-400',
      borderColor: 'border-red-500',
      bgColor: 'bg-red-900/50',
      valueBorderColor: 'border-red-600',
      valueTextColor: 'text-red-400'
    };
  };

  const config = getStatusConfig();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={`bg-gray-900 ${config.borderColor} text-white max-w-md max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-3 ${config.titleColor}`}>
            {config.icon}
            <span className="text-xl">{config.title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Código de resultado */}
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <span className="text-gray-400 text-sm">Código: </span>
            <span className={`font-mono font-bold text-lg ${config.valueTextColor}`}>
              {transaction.transactionResult}
            </span>
          </div>

          {/* NSU LOCAL - Campo principal para planilha PayGo */}
          {nsuLocal && (
            <div className={`${config.bgColor} ${config.valueBorderColor} border-2 rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${config.titleColor}`}>
                  📋 NSU LOCAL (para planilha)
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-gray-300 hover:text-white"
                  onClick={() => copyToClipboard(nsuLocal, 'nsuLocal')}
                >
                  {copiedField === 'nsuLocal' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className={`text-3xl font-bold font-mono ${config.valueTextColor} text-center`}>
                {nsuLocal}
              </p>
              <p className="text-xs text-gray-400 text-center mt-2">
                saidaTransacao.obtemNsuLocal()
              </p>
            </div>
          )}

          {/* Valor */}
          {transaction.amount && (
            <div className={`${config.bgColor} border ${config.valueBorderColor} rounded-lg p-3 text-center`}>
              <p className={`text-sm ${config.titleColor} mb-1`}>VALOR</p>
              <p className={`text-2xl font-bold ${config.valueTextColor}`}>
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          )}

          {/* Dados da transação */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              DADOS DA TRANSAÇÃO
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {transaction.transactionNsu && (
                <>
                  <span className="text-gray-400">NSU Transação:</span>
                  <span className="text-white font-bold">{transaction.transactionNsu}</span>
                </>
              )}
              
              {transaction.hostNsu && transaction.hostNsu !== transaction.transactionNsu && (
                <>
                  <span className="text-gray-400">NSU Host:</span>
                  <span className="text-white">{transaction.hostNsu}</span>
                </>
              )}
              
              {transaction.authorizationCode && (
                <>
                  <span className="text-gray-400">Autorização:</span>
                  <span className="text-green-400 font-bold">{transaction.authorizationCode}</span>
                </>
              )}
              
              {transaction.cardName && (
                <>
                  <span className="text-gray-400">Bandeira:</span>
                  <span className="text-white">{transaction.cardName}</span>
                </>
              )}
              
              {transaction.providerName && (
                <>
                  <span className="text-gray-400">Provedor:</span>
                  <span className="text-white">{transaction.providerName}</span>
                </>
              )}
              
              {transaction.merchantId && (
                <>
                  <span className="text-gray-400">Merchant ID:</span>
                  <span className="text-gray-300 text-xs">{transaction.merchantId}</span>
                </>
              )}
              
              {transaction.confirmationTransactionId && (
                <>
                  <span className="text-gray-400">ID Confirmação:</span>
                  <span className="text-yellow-400 text-xs">{transaction.confirmationTransactionId}</span>
                </>
              )}
            </div>
            
            {transaction.resultMessage && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <span className="text-gray-400 text-xs">Mensagem: </span>
                <span className={`text-sm ${isApproved ? 'text-green-400' : isDenied ? 'text-red-400' : 'text-yellow-400'}`}>
                  {transaction.resultMessage}
                </span>
              </div>
            )}
          </div>

          {/* Botões de impressão - apenas se aprovado */}
          {isApproved && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                COMPROVANTES
              </h4>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handlePrintMerchant}
                  className="bg-blue-600 text-white h-12 flex flex-col items-center justify-center gap-1"
                  disabled={!transaction.merchantReceipt}
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-xs">Via Lojista</span>
                </Button>
                
                <Button 
                  onClick={handlePrintCustomer}
                  className="bg-purple-600 text-white h-12 flex flex-col items-center justify-center gap-1"
                  disabled={!transaction.cardholderReceipt}
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-xs">Via Cliente</span>
                </Button>
              </div>
              
              {!transaction.merchantReceipt && !transaction.cardholderReceipt && (
                <p className="text-xs text-gray-500 text-center">
                  Comprovantes não disponíveis para esta transação
                </p>
              )}
            </div>
          )}

          {/* Botão Fechar */}
          <Button 
            onClick={onClose}
            className="w-full bg-gray-700 text-white h-12 mt-4"
          >
            <X className="w-4 h-4 mr-2" />
            FECHAR E NOVA TRANSAÇÃO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TEFTransactionSuccessModal;

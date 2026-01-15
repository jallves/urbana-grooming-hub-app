import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, X, CreditCard, FileText } from 'lucide-react';

interface TransactionData {
  operation: string;
  transactionResult: number;
  amount?: number;
  transactionNsu?: string;
  terminalNsu?: string;
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
  if (!transaction) return null;

  const formatCurrency = (centavos: number) => {
    return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
  };

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-gray-900 border-green-500 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-8 h-8" />
            <span className="text-xl">TRANSAÇÃO APROVADA</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Valor em destaque */}
          <div className="bg-green-900/50 border border-green-600 rounded-lg p-4 text-center">
            <p className="text-sm text-green-300 mb-1">VALOR APROVADO</p>
            <p className="text-3xl font-bold text-green-400">
              {transaction.amount ? formatCurrency(transaction.amount) : 'R$ 0,00'}
            </p>
          </div>

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
              
              {transaction.terminalNsu && (
                <>
                  <span className="text-gray-400">NSU Terminal:</span>
                  <span className="text-white">{transaction.terminalNsu}</span>
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
                <span className="text-green-400 text-sm">{transaction.resultMessage}</span>
              </div>
            )}
          </div>

          {/* Botões de impressão */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              COMPROVANTES
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handlePrintMerchant}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex flex-col items-center justify-center gap-1"
                disabled={!transaction.merchantReceipt}
              >
                <Printer className="w-4 h-4" />
                <span className="text-xs">Via Lojista</span>
              </Button>
              
              <Button 
                onClick={handlePrintCustomer}
                className="bg-purple-600 hover:bg-purple-700 text-white h-12 flex flex-col items-center justify-center gap-1"
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

          {/* Botão Fechar */}
          <Button 
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white h-12 mt-4"
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

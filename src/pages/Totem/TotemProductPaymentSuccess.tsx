import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Mail, MailCheck, MailX, Receipt, ShoppingBag, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import barbershopBg from '@/assets/barbershop-background.jpg';


const AUTO_REDIRECT_SECONDS = 12;

const TotemProductPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailSentRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent' | 'no-email' | 'error'>('sending');
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [showReceipt, setShowReceipt] = useState(false);

  // CRÍTICO: Armazenar state em refs para evitar perda em re-renders
  const stateRef = useRef(location.state);
  if (location.state && !stateRef.current) {
    stateRef.current = location.state;
  }

  const { sale: saleFromState, client, transactionData } = stateRef.current || {};

  const sale = saleFromState ? {
    ...saleFromState,
    total: saleFromState.total || saleFromState.valor_total || 0
  } : null;

  const hasValidData = !!(sale && client);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hasValidData && !redirectedRef.current) {
      redirectedRef.current = true;
      console.warn('[ProductPaymentSuccess] Dados incompletos, redirecionando...');
      navigate('/totem/home');
      return;
    }
    if (!hasValidData) return;

    // Animação: mostrar recibo após 800ms
    const receiptTimer = setTimeout(() => setShowReceipt(true), 800);

    // NÃO enviar e-mail automaticamente aqui
    // O e-mail é enviado manualmente pelo usuário via TotemReceiptOptionsModal
    // (evita e-mail duplicado)
    if (!client?.email) {
      setEmailStatus('no-email');
    }

    // Countdown para voltar ao início
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer de segurança para redirect
    timerRef.current = setTimeout(() => {
      navigate('/totem/home');
    }, AUTO_REDIRECT_SECONDS * 1000);

    return () => {
      clearTimeout(receiptTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasValidData) return null;

  const getPaymentMethodText = () => {
    const method = transactionData?.paymentMethod;
    if (method === 'credit') return 'Cartão de Crédito';
    if (method === 'debit') return 'Cartão de Débito';
    if (method === 'pix') return 'PIX';
    return 'Cartão';
  };

  const firstName = client?.nome?.split(' ')[0] || 'Cliente';

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 font-poppins relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={barbershopBg} alt="Barbearia" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-urbana-black/90 via-urbana-black/85 to-urbana-brown/80" />
      </div>

      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-urbana-gold/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative text-center space-y-5 max-w-2xl w-full z-10">
        {/* Ícone de sucesso animado */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400 to-green-500 blur-3xl opacity-40" />
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl border-4 border-emerald-300/30">
              <CheckCircle className="w-14 h-14 md:w-18 md:h-18 text-white" strokeWidth={3} />
            </div>
          </div>
        </motion.div>

        {/* Mensagem principal */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400">
            Compra Finalizada! 🎉
          </h1>
          <p className="text-2xl md:text-3xl text-urbana-light font-semibold">
            Obrigado, {firstName}!
          </p>
        </motion.div>

        {/* Status do e-mail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {emailStatus === 'sending' && client?.email && (
              <motion.div
                key="sending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-urbana-light/70"
              >
                <Mail className="w-5 h-5 animate-pulse text-urbana-gold" />
                <span className="text-sm">Enviando comprovante para {client.email}...</span>
              </motion.div>
            )}
            {emailStatus === 'sent' && client?.email && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-emerald-400"
              >
                <MailCheck className="w-5 h-5" />
                <span className="text-sm font-medium">✅ Comprovante enviado para {client.email}</span>
              </motion.div>
            )}
            {emailStatus === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-amber-400"
              >
                <MailX className="w-5 h-5" />
                <span className="text-sm">Não foi possível enviar o comprovante por e-mail</span>
              </motion.div>
            )}
            {emailStatus === 'no-email' && (
              <motion.div
                key="no-email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-urbana-light/50"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">Cadastre um e-mail para receber comprovantes</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recibo detalhado */}
        <AnimatePresence>
          {showReceipt && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-urbana-black/50 backdrop-blur-md border-2 border-urbana-gold/30 rounded-2xl p-5 space-y-3 max-h-[35vh] overflow-y-auto"
            >
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-urbana-gold border-b border-urbana-gold/20 pb-2">
                <Receipt className="w-4 h-4" />
                COMPROVANTE DA TRANSAÇÃO
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-urbana-light/60">Data:</span>
                  <span className="text-urbana-light">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-urbana-light/60">Pagamento:</span>
                  <span className="text-urbana-light">{getPaymentMethodText()}</span>
                </div>
                {transactionData?.nsu && (
                  <div className="flex justify-between">
                    <span className="text-urbana-light/60">NSU:</span>
                    <span className="text-urbana-light font-mono">{transactionData.nsu}</span>
                  </div>
                )}

                {/* Itens */}
                {sale?.items && sale.items.length > 0 && (
                  <div className="py-2 border-t border-b border-urbana-gold/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-urbana-light/60 mb-1">
                      <ShoppingBag className="w-3 h-3" />
                      Produtos:
                    </div>
                    {sale.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-urbana-light truncate max-w-[60%]">
                          {item.quantidade || 1}x {item.nome}
                        </span>
                        <span className="text-urbana-gold font-medium">
                          R$ {Number(item.subtotal || (item.preco_unitario * (item.quantidade || 1))).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-urbana-gold/30">
                  <span className="text-lg font-bold text-urbana-light">TOTAL:</span>
                  <span className="text-2xl font-black text-urbana-gold">
                    R$ {sale?.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de voltar + countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="space-y-3 pt-2"
        >
          <Button
            onClick={() => navigate('/totem/home')}
            size="lg"
            className="h-14 px-10 text-lg bg-gradient-to-r from-urbana-gold to-urbana-gold-dark text-urbana-black font-bold rounded-xl shadow-lg shadow-urbana-gold/20 hover:shadow-urbana-gold/40 transition-all"
          >
            <Home className="w-5 h-5 mr-2" />
            Nova Compra
          </Button>

          <div className="flex items-center justify-center gap-2 text-urbana-light/40 text-sm">
            <Sparkles className="w-4 h-4 text-urbana-gold/60" />
            <span>Voltando ao início em {countdown}s</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-base text-urbana-gold font-bold pt-1"
        >
          Costa Urbana Barbearia ✂️
        </motion.p>
      </div>
    </div>
  );
};

export default TotemProductPaymentSuccess;

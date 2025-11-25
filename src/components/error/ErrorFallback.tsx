import React from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  onReset 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-urbana-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-urbana-black/90 backdrop-blur-xl border-2 border-red-500/50 shadow-2xl p-8">
          {/* Ícone de erro */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.2 
            }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertTriangle size={40} className="text-white" />
            </div>
          </motion.div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-urbana-light text-center mb-4">
            Ops! Algo deu errado
          </h1>

          {/* Descrição */}
          <p className="text-urbana-light/80 text-center mb-8 font-raleway text-lg">
            Não se preocupe, nossa equipe já foi notificada. 
            Por favor, tente uma das opções abaixo.
          </p>

          {/* Mensagem de erro simplificada */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 font-mono text-sm break-words">
                {error.message}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              onClick={onReset || handleReload}
              className="flex-1 bg-gradient-to-r from-urbana-gold to-yellow-500 hover:from-yellow-500 hover:to-urbana-gold text-urbana-black font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Tentar Novamente
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1 border-urbana-gold text-urbana-gold hover:bg-urbana-gold/10 py-3 rounded-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Ir para Início
            </Button>
          </div>

          {/* Detalhes técnicos (expansível) */}
          <div className="border-t border-urbana-light/10 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-urbana-light/60 hover:text-urbana-light transition-colors"
            >
              <span className="text-sm font-raleway">Detalhes técnicos</span>
              {showDetails ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 bg-urbana-black/50 rounded-lg border border-urbana-light/10">
                    {/* Stack trace do erro */}
                    {error?.stack && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold text-urbana-gold mb-2 uppercase tracking-wide">
                          Stack Trace
                        </h3>
                        <pre className="text-xs text-urbana-light/60 overflow-x-auto whitespace-pre-wrap font-mono">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {/* Component stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-xs font-semibold text-urbana-gold mb-2 uppercase tracking-wide">
                          Component Stack
                        </h3>
                        <pre className="text-xs text-urbana-light/60 overflow-x-auto whitespace-pre-wrap font-mono">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className="text-xs text-urbana-light/40 font-raleway">
              ID do Erro: {Date.now().toString(36)}
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

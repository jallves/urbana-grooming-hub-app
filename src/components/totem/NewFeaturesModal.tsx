import React from 'react';
import { X, Zap, Clock, Star, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NewFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal mostrando as novas features do Totem
 */
export const NewFeaturesModal: React.FC<NewFeaturesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: Zap,
      title: 'Express Mode',
      description: 'Check-in rápido em um toque para clientes frequentes',
      color: 'from-yellow-500/20 to-yellow-600/10',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-500',
    },
    {
      icon: Clock,
      title: 'Tela de Espera Inteligente',
      description: 'Veja sua posição na fila e tempo estimado em tempo real',
      color: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-500',
    },
    {
      icon: Star,
      title: 'Avaliação Pós-Atendimento',
      description: 'Avalie seu atendimento e deixe feedback para melhorarmos',
      color: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-500',
    },
    {
      icon: TrendingUp,
      title: 'Sugestões Inteligentes',
      description: 'Serviços adicionais sugeridos durante o checkout',
      color: 'from-green-500/20 to-green-600/10',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-500',
    },
    {
      icon: Calendar,
      title: 'Agendamento Rápido',
      description: 'Agende seu próximo corte direto no checkout',
      color: 'from-urbana-gold/20 to-urbana-gold-dark/10',
      borderColor: 'border-urbana-gold/30',
      iconColor: 'text-urbana-gold',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-urbana-black/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-4xl bg-urbana-black-soft border-2 border-urbana-gold/30 p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-urbana-gold/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-urbana-gold" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-urbana-light mb-2">
                Novidades do Totem!
              </h2>
              <p className="text-urbana-light/60 text-lg">
                Experiência ainda mais completa e moderna
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-urbana-light hover:bg-urbana-gold/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  'p-6 rounded-lg border-2 bg-gradient-to-br',
                  feature.color,
                  feature.borderColor,
                  'animate-scale-in'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Icon className={cn('w-8 h-8', feature.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-urbana-light mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-urbana-light/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How to Use */}
        <div className="bg-urbana-gold/10 border border-urbana-gold/30 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-urbana-gold mb-4">
            Como usar as novas features:
          </h3>
          <ol className="space-y-3 text-urbana-light/80">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                <strong className="text-urbana-light">Check-in:</strong> Digite seu telefone e faça check-in. Clientes frequentes terão acesso ao Express Mode!
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                <strong className="text-urbana-light">Aguarde:</strong> A tela de espera mostrará sua posição na fila e galeria de trabalhos
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                <strong className="text-urbana-light">Checkout:</strong> Adicione serviços extras e escolha sua forma de pagamento
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-urbana-gold text-urbana-black flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>
                <strong className="text-urbana-light">Avalie:</strong> Deixe sua avaliação e agende seu próximo corte em segundos!
              </span>
            </li>
          </ol>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={onClose}
          className="w-full text-xl py-8 bg-urbana-gold text-urbana-black hover:bg-urbana-gold-light font-bold"
        >
          <Sparkles className="w-6 h-6 mr-3" />
          Entendi! Vamos começar
        </Button>
      </Card>
    </div>
  );
};

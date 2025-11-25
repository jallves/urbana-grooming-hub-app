import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthContainer from '@/components/ui/containers/AuthContainer';

export default function PainelClienteEmailConfirmation() {
  const navigate = useNavigate();

  return (
    <AuthContainer
      title="Costa Urbana"
      subtitle="Confirme seu E-mail"
    >
      <div className="w-full space-y-6 text-center">
        {/* Ícone de E-mail */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-urbana-gold/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-urbana-gold" />
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="space-y-3">
          <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full mb-2">
            <p className="text-green-400 font-semibold text-sm">✅ Cadastro Criado com Sucesso!</p>
          </div>
          
          <h2 className="text-2xl font-bold text-urbana-light">
            Confirme seu E-mail
          </h2>
          <p className="text-urbana-light/70 text-base leading-relaxed">
            Sua conta foi criada com sucesso! 🎉
          </p>
          <p className="text-urbana-light/70 text-base leading-relaxed">
            Para ativar sua conta, basta clicar no link de confirmação que acabamos de enviar para o seu e-mail.
          </p>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-urbana-black/30 border border-urbana-gold/20 rounded-xl p-4 space-y-2">
          <p className="text-sm text-urbana-light/60">
            📬 Não encontrou o e-mail? Verifique sua pasta de spam ou lixo eletrônico.
          </p>
          <p className="text-sm text-urbana-light/60">
            ⏱️ O link de confirmação é válido por 24 horas.
          </p>
        </div>

        {/* Botão Voltar */}
        <Button
          variant="outline"
          className="w-full border-urbana-gold/30 bg-urbana-black/30 text-urbana-light hover:bg-urbana-gold/20 hover:text-urbana-gold hover:border-urbana-gold/50 h-12 rounded-xl transition-all"
          onClick={() => navigate('/painel-cliente/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Login
        </Button>
      </div>
    </AuthContainer>
  );
}

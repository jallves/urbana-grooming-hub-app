import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationPopupProps {
  open: boolean;
  email: string;
  clienteId: string;
  onConfirmed: () => void;
}

export function EmailVerificationPopup({
  open,
  email,
  clienteId,
  onConfirmed,
}: EmailVerificationPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('painel_clientes')
        .update({ email_verified: true } as any)
        .eq('id', clienteId);

      if (error) throw error;

      toast({
        title: '✅ E-mail confirmado!',
        description: 'Obrigado por verificar seu e-mail.',
        duration: 3000,
      });
      onConfirmed();
    } catch (err) {
      console.error('Erro ao confirmar e-mail:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível confirmar. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNewEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        variant: 'destructive',
        title: 'E-mail inválido',
        description: 'Por favor, insira um e-mail válido.',
      });
      return;
    }

    if (trimmed === email.toLowerCase()) {
      // Same email, just confirm
      await handleConfirm();
      return;
    }

    setSaving(true);
    try {
      // Update email in painel_clientes and mark as verified
      const { error } = await supabase
        .from('painel_clientes')
        .update({ 
          email: trimmed, 
          email_verified: true 
        } as any)
        .eq('id', clienteId);

      if (error) throw error;

      // Also update in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        email: trimmed,
      });

      if (authError) {
        console.warn('Aviso: e-mail atualizado no perfil mas não no auth:', authError.message);
      }

      toast({
        title: '✅ E-mail atualizado e confirmado!',
        description: `Seu e-mail foi alterado para ${trimmed}.`,
        duration: 4000,
      });
      onConfirmed();
    } catch (err) {
      console.error('Erro ao atualizar e-mail:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o e-mail. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="bg-urbana-black border-urbana-gold/30 text-urbana-light sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-urbana-gold/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-urbana-gold" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-urbana-light">
            Confirme seu E-mail
          </DialogTitle>
          <DialogDescription className="text-urbana-light/70 text-sm">
            Verifique se o e-mail cadastrado está correto. Caso não esteja, você pode corrigí-lo agora.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!isEditing ? (
            <div className="bg-urbana-black/50 border border-urbana-gold/20 rounded-xl p-4 space-y-3">
              <Label className="text-xs text-urbana-light/60 uppercase tracking-wider">
                Seu e-mail cadastrado
              </Label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-urbana-light font-medium text-base break-all">
                  {email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-urbana-gold hover:text-urbana-gold/80 hover:bg-urbana-gold/10 shrink-0"
                  onClick={() => {
                    setIsEditing(true);
                    setNewEmail(email);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="new-email" className="text-sm text-urbana-light/80">
                Novo e-mail
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-urbana-black/50 border-urbana-gold/30 text-urbana-light placeholder:text-urbana-light/40 focus:border-urbana-gold h-12"
                placeholder="seu@email.com"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-urbana-light/60 hover:text-urbana-light"
                onClick={() => setIsEditing(false)}
              >
                Cancelar edição
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {!isEditing ? (
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold h-12 rounded-xl"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-urbana-black border-t-transparent rounded-full animate-spin" />
                  Confirmando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Sim, está correto!
                </span>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSaveNewEmail}
              disabled={saving}
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-urbana-black font-semibold h-12 rounded-xl"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-urbana-black border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Salvar e Confirmar
                </span>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

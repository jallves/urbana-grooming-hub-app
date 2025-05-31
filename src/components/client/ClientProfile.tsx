
import React, { useState } from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Calendar, Save } from 'lucide-react';

export const ClientProfile = () => {
  const { client, updateClient } = useClientAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    birth_date: client?.birth_date || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    
    const { error } = await updateClient(formData);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setIsEditing(false);
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      birth_date: client?.birth_date || '',
    });
    setIsEditing(false);
  };

  if (!client) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
        <CardContent className="p-6 text-center">
          <p className="text-white">Carregando informações do perfil...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-urbana-gold/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Meu Perfil</CardTitle>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
            >
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            className="bg-white/20 border-urbana-gold/50 text-white placeholder:text-white/70 disabled:opacity-70"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            className="bg-white/20 border-urbana-gold/50 text-white placeholder:text-white/70 disabled:opacity-70"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            className="bg-white/20 border-urbana-gold/50 text-white placeholder:text-white/70 disabled:opacity-70"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date" className="text-white flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data de Nascimento
          </Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            disabled={!isEditing}
            className="bg-white/20 border-urbana-gold/50 text-white placeholder:text-white/70 disabled:opacity-70"
          />
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-urbana-gold hover:bg-urbana-gold/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-urbana-gold/50 text-urbana-gold hover:bg-urbana-gold hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

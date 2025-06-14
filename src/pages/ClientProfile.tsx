import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { 
  ArrowLeft, 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Save, 
  Edit, 
  Scissors 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const ClientProfile = () => {
  const { client, signOut, updateClient, loading } = useClientAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    whatsapp: client?.whatsapp || '',
    birth_date: client?.birth_date || ''
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/cliente/login" replace />;
  }

  const handleSave = async () => {
    const { error } = await updateClient(formData);
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      whatsapp: client?.whatsapp || '',
      birth_date: client?.birth_date || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-[#0c1423] border-b border-[#1f2a3c]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cliente/dashboard')}
                className="text-white hover:bg-[#1f2a3c]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <Scissors className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-serif text-white">
                  Meu Perfil
                </h1>
                <p className="text-sm text-[#94a3b8]">
                  Gerencie suas informações pessoais
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-[#0c1423] border-[#1f2a3c]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-yellow-500" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-[#cbd5e1]">
                  Mantenha seus dados atualizados
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'default'}
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={isEditing ? 
                  'border-[#334155] text-[#cbd5e1] hover:bg-[#1f2a3c]' : 
                  'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black'
                }
              >
                {isEditing ? 'Cancelar' : <><Edit className="h-4 w-4 mr-2" /> Editar</>}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campos */}
              {[
                { label: 'Nome Completo', value: 'name' },
                { label: 'Email', value: 'email', icon: Mail },
                { label: 'Telefone', value: 'phone', icon: Phone },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'Data de Nascimento', value: 'birth_date', icon: Calendar },
                { label: 'Membro desde', value: 'created_at' }
              ].map((field, idx) => {
                const Icon = field.icon;
                const isDate = field.value === 'birth_date';
                const isCreated = field.value === 'created_at';

                const displayValue = isCreated
                  ? format(new Date(client.created_at), "MMMM 'de' yyyy", { locale: ptBR })
                  : isDate && client.birth_date
                  ? format(new Date(client.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : client[field.value] || (isDate ? 'Não informado' : 'Não informado');

                return (
                  <div key={idx} className="space-y-2">
                    <Label className="text-white">{field.label}</Label>
                    {isEditing && !isCreated ? (
                      <Input
                        type={isDate ? 'date' : 'text'}
                        value={formData[field.value]}
                        onChange={(e) => setFormData({ ...formData, [field.value]: e.target.value })}
                        className="bg-[#1f2a3c] border-[#334155] text-white"
                      />
                    ) : (
                      <div className="p-3 bg-[#1f2a3c] rounded-md text-white flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-yellow-500" />}
                        {displayValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isEditing && (
              <>
                <Separator className="bg-[#334155]" />
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-[#334155] text-[#cbd5e1] hover:bg-[#1f2a3c]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="bg-[#0c1423] border-[#1f2a3c] hover:bg-[#1f2a3c]/80 cursor-pointer transition"
            onClick={() => navigate('/cliente/novo-agendamento')}
          >
            <CardContent className="p-6 text-center">
              <Scissors className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Agendar Corte</h3>
              <p className="text-[#cbd5e1]">Marque seu próximo corte</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#0c1423] border-[#1f2a3c] hover:bg-[#1f2a3c]/80 cursor-pointer transition"
            onClick={() => navigate('/cliente/dashboard')}
          >
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Meus Agendamentos</h3>
              <p className="text-[#cbd5e1]">Veja seus agendamentos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

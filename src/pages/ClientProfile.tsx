
import React from 'react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  Calendar,
  LogOut, 
  Scissors,
  Save,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800">
      {/* Header */}
      <div className="bg-stone-900/80 backdrop-blur-sm border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/cliente/dashboard')}
                className="text-white hover:bg-stone-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                <Scissors className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Meu Perfil
                </h1>
                <p className="text-sm text-stone-400">Gerencie suas informações pessoais</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="bg-stone-800 border-red-400/30 text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-stone-800 border-stone-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-500" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription className="text-stone-300">
                  Mantenha seus dados atualizados para uma melhor experiência
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={isEditing ? 
                  "border-stone-600 text-stone-300 hover:bg-stone-700" : 
                  "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black"
                }
              >
                {isEditing ? 'Cancelar' : <Edit className="h-4 w-4 mr-2" />}
                {isEditing ? '' : 'Editar'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Nome Completo</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-stone-700 border-stone-600 text-white"
                  />
                ) : (
                  <div className="p-3 bg-stone-700/50 rounded-md text-white">
                    {client.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-stone-700 border-stone-600 text-white"
                  />
                ) : (
                  <div className="p-3 bg-stone-700/50 rounded-md text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500" />
                    {client.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Telefone</Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-stone-700 border-stone-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <div className="p-3 bg-stone-700/50 rounded-md text-white flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-500" />
                    {client.phone}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">WhatsApp</Label>
                {isEditing ? (
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="bg-stone-700 border-stone-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <div className="p-3 bg-stone-700/50 rounded-md text-white">
                    {client.whatsapp || 'Não informado'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Data de Nascimento</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="bg-stone-700 border-stone-600 text-white"
                  />
                ) : (
                  <div className="p-3 bg-stone-700/50 rounded-md text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    {client.birth_date ? 
                      format(new Date(client.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 
                      'Não informado'
                    }
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Membro desde</Label>
                <div className="p-3 bg-stone-700/50 rounded-md text-white">
                  {format(new Date(client.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>

            {isEditing && (
              <>
                <Separator className="bg-stone-600" />
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-stone-600 text-stone-300 hover:bg-stone-700"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-stone-800 border-stone-700 hover:bg-stone-700/50 transition-colors cursor-pointer"
                onClick={() => navigate('/cliente/novo-agendamento')}>
            <CardContent className="p-6 text-center">
              <Scissors className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Agendar Corte
              </h3>
              <p className="text-stone-400">
                Marque seu próximo corte de cabelo
              </p>
            </CardContent>
          </Card>

          <Card className="bg-stone-800 border-stone-700 hover:bg-stone-700/50 transition-colors cursor-pointer"
                onClick={() => navigate('/cliente/dashboard')}>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Meus Agendamentos
              </h3>
              <p className="text-stone-400">
                Visualize seus cortes agendados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

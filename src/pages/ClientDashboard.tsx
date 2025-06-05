import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAppointmentsByClientId, getClientById } from '@/api'
import { Appointment, Client } from '@/types'
import { format } from 'date-fns'
import { LogOut, Scissors, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.id) {
      getClientById(user.id).then(setClient)
      getAppointmentsByClientId(user.id).then(setAppointments)
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-600 border border-blue-200'
      case 'confirmed':
        return 'bg-green-100 text-green-600 border border-green-200'
      case 'completed':
        return 'bg-gray-200 text-gray-700 border border-gray-300'
      case 'cancelled':
        return 'bg-red-100 text-red-600 border border-red-200'
      default:
        return 'bg-gray-200 text-gray-700 border border-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-300 to-amber-400 rounded-full flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Olá, {client?.name}!
                </h1>
                <p className="text-sm text-gray-500">Bem-vindo à sua barbearia</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                onClick={() => navigate('/cliente/perfil')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="bg-white border-red-300 text-red-500 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">Próximo Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-gray-700">
                    Data:{' '}
                    <span className="font-medium">
                      {format(new Date(appointments[0].date), 'dd/MM/yyyy')}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    Hora:{' '}
                    <span className="font-medium">
                      {format(new Date(appointments[0].date), 'HH:mm')}
                    </span>
                  </p>
                  <p className="text-gray-700">
                    Status:{' '}
                    <Badge className={getStatusColor(appointments[0].status)}>
                      {appointments[0].status}
                    </Badge>
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Você não possui agendamentos.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">Novo Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Agende seu próximo corte de cabelo ou barba com facilidade.
              </p>
              <Button
                className="w-full bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-white font-semibold"
                onClick={() => navigate('/cliente/novo-agendamento')}
              >
                Agendar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico de Agendamentos</h2>
          {appointments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appt) => (
                <Card key={appt.id} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-gray-800 text-base font-medium">
                      {format(new Date(appt.date), 'dd/MM/yyyy')} - {format(new Date(appt.date), 'HH:mm')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      Status:{' '}
                      <Badge className={getStatusColor(appt.status)}>{appt.status}</Badge>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum agendamento encontrado.</p>
          )}
        </div>
      </main>
    </div>
  )
}


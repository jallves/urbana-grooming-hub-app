// Cores alteradas para tema claro (fundo claro, texto escuro, detalhes sutis)
<div className="min-h-screen bg-gradient-to-br from-white via-slate-100 to-white">
  {/* Header */}
  <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Olá, {client.name}!
            </h1>
            <p className="text-sm text-slate-500">Bem-vindo à sua barbearia</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
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

  {/* Cards de ações rápidas */}
  <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300 hover:shadow-lg hover:shadow-yellow-300/30 transition-all">
    ...
    <CardTitle className="text-slate-800 flex items-center gap-2">
      <Plus className="h-5 w-5" />
      Novo Corte
    </CardTitle>
    <CardDescription className="text-slate-600">
      Agende seu próximo serviço
    </CardDescription>
    ...
    <Button 
      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold"
    >
      Agendar Agora
    </Button>
  </Card>

  <Card className="bg-white border-slate-200">
    <CardTitle className="text-slate-800 flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      Próximos Cortes
    </CardTitle>
    <CardDescription className="text-slate-500">
      Seus agendamentos confirmados
    </CardDescription>
    ...
    <div className="text-2xl font-bold text-slate-800 mb-1">
      {upcomingAppointments.length}
    </div>
    <p className="text-sm text-slate-500">
      {upcomingAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
    </p>
  </Card>

  {/* Badges de status */}
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  {/* Cartões de agendamentos */}
  <Card key={appointment.id} className="bg-white border-slate-200 hover:bg-slate-50 transition-colors">
    ...
    <h3 className="text-lg font-semibold text-slate-800 mb-1">
      {appointment.services?.name}
    </h3>
    ...
    <p className="text-slate-800 font-semibold">
      R$ {appointment.services?.price?.toFixed(2)}
    </p>
    ...
    <div className="space-y-2 text-slate-600">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span className="text-sm">
          {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
    </div>
  </Card>

  {/* Card de contato */}
  <Card className="bg-white border-slate-200">
    <CardTitle className="text-slate-800 flex items-center gap-2">
      <MapPin className="h-5 w-5 text-yellow-500" />
      Nossa Barbearia
    </CardTitle>
    ...
    <p className="text-slate-800 font-medium">Telefone</p>
    <p className="text-slate-600">(11) 99999-9999</p>
  </Card>


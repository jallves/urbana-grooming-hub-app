export default function ClientRegister() {
  // ... (código anterior permanece igual)

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className={`bg-[#111827] border-gray-700 ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-[#F59E0B]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white font-clash">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-[#9CA3AF] font-inter">
            Crie sua conta para agendar seus horários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 font-inter">
            {/* Mensagem de erro geral */}
            {errors.general && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            {/* Campos do formulário */}
            <div>
              <Label htmlFor="name" className="text-white">Nome completo *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF] ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Seu nome completo"
                required
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* ... outros campos com padrão similar ... */}

            <Button
              type="submit"
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>

            <div className="text-center text-sm space-y-2 text-[#9CA3AF]">
              <div>
                <span>Já tem uma conta? </span>
                <Link 
                  to="/cliente/login" 
                  className="text-[#F59E0B] hover:text-[#D97706] hover:underline"
                >
                  Fazer login
                </Link>
              </div>
              <div>
                <Link 
                  to="/" 
                  className="hover:text-[#F59E0B] hover:underline"
                >
                  Voltar ao início
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

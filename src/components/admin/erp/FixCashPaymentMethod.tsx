import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FixCashPaymentMethod: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      toast.info('Iniciando correção...', {
        description: 'Atualizando registros com payment_method = cash'
      });

      const { data, error } = await supabase.functions.invoke('fix-cash-payment-method');

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast.success('✅ Correção concluída!', {
          description: `${data.summary.updated} registros atualizados para PIX`
        });
      } else {
        toast.error('Erro na correção', {
          description: data.error
        });
      }
    } catch (error: any) {
      console.error('Erro ao corrigir:', error);
      toast.error('Erro ao executar correção', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Corrigir Método de Pagamento
        </CardTitle>
        <CardDescription>
          Alguns registros financeiros foram criados com payment_method = "cash" (dinheiro), 
          mas o sistema não aceita pagamento em dinheiro. Esta ferramenta atualiza esses 
          registros para PIX.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Atenção:</strong> Esta ação irá atualizar todos os registros com 
            payment_method = "cash" para "pix" no ERP Financeiro.
          </p>
        </div>

        <Button
          onClick={handleFix}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Corrigindo...
            </>
          ) : (
            'Executar Correção'
          )}
        </Button>

        {result && result.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-900">Correção Concluída</p>
            </div>
            <div className="space-y-1 text-sm text-green-800">
              <p>• Total encontrado: {result.summary.total_found}</p>
              <p>• Atualizados: {result.summary.updated}</p>
              <p>• Falhas: {result.summary.failed}</p>
            </div>
            
            {result.summary.details && result.summary.details.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-green-900">
                  Ver detalhes
                </summary>
                <div className="mt-2 space-y-1">
                  {result.summary.details.map((detail: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-white rounded border border-green-200">
                      <p>ID: {detail.id}</p>
                      <p>Status: {detail.status}</p>
                      {detail.payment_number && <p>Número: {detail.payment_number}</p>}
                      {detail.old_method && <p>De: {detail.old_method} → Para: {detail.new_method}</p>}
                      {detail.error && <p className="text-red-600">Erro: {detail.error}</p>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Download,
  Trash2,
  FileSpreadsheet,
  Calendar,
  Search,
  Copy,
  Check,
  RefreshCw,
  FileText,
  CreditCard,
  Clock,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  isAndroidTEFAvailable, 
  getLogsAndroid 
} from '@/lib/tef/tefAndroidBridge';

// Interface para transação extraída dos logs
interface TEFTransactionRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  ordemId: string;
  // Campo crítico para a planilha PayGo - NSU Local
  nsuLocal: string;
  // Outros campos úteis
  nsuHost?: string;
  autorizacao?: string;
  bandeira?: string;
  valor?: number;
  valorCentavos?: number;
  metodo?: string;
  parcelas?: number;
  status: 'aprovado' | 'negado' | 'cancelado' | 'erro' | 'pendente';
  codigoResposta?: string;
  mensagem?: string;
  // Dados brutos para debug
  rawData?: string;
}

// Função para extrair NSU Local e outros dados dos logs
function parseTransactionsFromLogs(logs: string[]): TEFTransactionRecord[] {
  const transactions: TEFTransactionRecord[] = [];
  let currentTransaction: Partial<TEFTransactionRecord> | null = null;
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    // Detectar início de transação
    if (log.includes('[TXN]') && log.includes('INICIANDO')) {
      currentTransaction = {
        id: `txn_${Date.now()}_${i}`,
        timestamp: new Date().toISOString(),
        status: 'pendente'
      };
      
      // Extrair ordem ID
      const ordemMatch = log.match(/ordemId[:\s]*([^\s,}]+)/i);
      if (ordemMatch) {
        currentTransaction.ordemId = ordemMatch[1].replace(/['"]/g, '');
      }
      
      // Extrair valor
      const valorMatch = log.match(/valor(?:Centavos)?[:\s]*(\d+)/i);
      if (valorMatch) {
        currentTransaction.valorCentavos = parseInt(valorMatch[1], 10);
        currentTransaction.valor = currentTransaction.valorCentavos / 100;
      }
      
      // Extrair método
      const metodoMatch = log.match(/metodo[:\s]*([^\s,}]+)/i);
      if (metodoMatch) {
        currentTransaction.metodo = metodoMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Detectar resposta com NSU Local (CRÍTICO PARA HOMOLOGAÇÃO)
    // PayGo retorna: transactionNsu (NSU do Host) e terminalNsu (NSU Local)
    if (log.includes('[RESP]') || log.includes('RESULTADO') || log.includes('saidaTransacao')) {
      if (!currentTransaction) {
        currentTransaction = {
          id: `txn_${Date.now()}_${i}`,
          timestamp: new Date().toISOString(),
          status: 'pendente'
        };
      }
      
      // NSU Local - CAMPO CRÍTICO (saidaTransacao.obtemNsuLocal() / terminalNsu)
      const nsuLocalMatch = log.match(/(?:terminalNsu|nsuLocal|obtemNsuLocal)[:\s]*['""]?(\d+)['""]?/i);
      if (nsuLocalMatch) {
        currentTransaction.nsuLocal = nsuLocalMatch[1];
      }
      
      // NSU Host (transactionNsu)
      const nsuHostMatch = log.match(/(?:transactionNsu|nsuHost|nsu)[:\s]*['""]?(\d+)['""]?/i);
      if (nsuHostMatch && !currentTransaction.nsuLocal) {
        currentTransaction.nsuHost = nsuHostMatch[1];
        // Se não tem NSU Local específico, usar o que tiver
        if (!currentTransaction.nsuLocal) {
          currentTransaction.nsuLocal = nsuHostMatch[1];
        }
      }
      
      // Autorização
      const authMatch = log.match(/(?:authorizationCode|autorizacao|authorization)[:\s]*['""]?([A-Z0-9]+)['""]?/i);
      if (authMatch) {
        currentTransaction.autorizacao = authMatch[1];
      }
      
      // Bandeira
      const bandeiraMatch = log.match(/(?:cardName|bandeira|card)[:\s]*['""]?([A-Za-z]+)['""]?/i);
      if (bandeiraMatch) {
        currentTransaction.bandeira = bandeiraMatch[1].toUpperCase();
      }
      
      // Status
      if (log.includes('aprovado') || log.includes('APROVADO') || log.includes('transactionResult":0') || log.includes('transactionResult: 0')) {
        currentTransaction.status = 'aprovado';
      } else if (log.includes('negado') || log.includes('NEGADO') || log.includes('recusad')) {
        currentTransaction.status = 'negado';
      } else if (log.includes('cancelado') || log.includes('CANCELADO')) {
        currentTransaction.status = 'cancelado';
      } else if (log.includes('erro') || log.includes('ERRO')) {
        currentTransaction.status = 'erro';
      }
      
      // Código resposta
      const codRespMatch = log.match(/(?:transactionResult|codigoResposta|resultCode)[:\s]*['""]?(-?\d+)['""]?/i);
      if (codRespMatch) {
        currentTransaction.codigoResposta = codRespMatch[1];
      }
      
      // Mensagem
      const msgMatch = log.match(/(?:resultMessage|mensagem|message)[:\s]*['""]?([^"',}]+)['""]?/i);
      if (msgMatch) {
        currentTransaction.mensagem = msgMatch[1];
      }
    }
    
    // Finalizar transação
    if (currentTransaction && (
      log.includes('FINALIZADO') || 
      log.includes('CONFIRMADO') || 
      log.includes('APROVADO') ||
      log.includes('NEGADO') ||
      log.includes('CANCELADO') ||
      log.includes('ERRO') ||
      (i === logs.length - 1 && currentTransaction.nsuLocal)
    )) {
      if (currentTransaction.nsuLocal || currentTransaction.ordemId) {
        const now = new Date();
        currentTransaction.timestamp = now.toISOString();
        currentTransaction.date = now.toLocaleDateString('pt-BR');
        currentTransaction.time = now.toLocaleTimeString('pt-BR');
        currentTransaction.rawData = logs.slice(Math.max(0, i - 10), i + 1).join('\n');
        
        transactions.push(currentTransaction as TEFTransactionRecord);
      }
      currentTransaction = null;
    }
  }
  
  return transactions;
}

// Função para parsear transações do localStorage (se armazenadas)
function getStoredTransactions(): TEFTransactionRecord[] {
  try {
    const stored = localStorage.getItem('tef_transactions_log');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erro ao ler transações armazenadas:', e);
  }
  return [];
}

// Função para salvar transação no localStorage
function storeTransaction(transaction: TEFTransactionRecord) {
  try {
    const existing = getStoredTransactions();
    const updated = [transaction, ...existing].slice(0, 500); // Manter últimas 500
    localStorage.setItem('tef_transactions_log', JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar transação:', e);
  }
}

// Aliases (mantém compatibilidade com a versão usada no PDV/relatório)
const getStoredTEFTransactions = getStoredTransactions;
const parseTransactionsFromAndroidLogs = parseTransactionsFromLogs;
const storeTEFTransaction = storeTransaction;
const mergeUniqueTEFTransactions = (
  parsed: TEFTransactionRecord[],
  stored: TEFTransactionRecord[]
): TEFTransactionRecord[] => {
  const all = [...parsed, ...stored];
  const unique = all.filter((txn, index, self) =>
    index ===
    self.findIndex(
      (t) =>
        t.id === txn.id ||
        (t.nsuLocal === txn.nsuLocal && t.ordemId === txn.ordemId)
    )
  );
  unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return unique;
};

export default function TotemTEFReportHomologacao() {
  const navigate = useNavigate();
  const goBackToPDV = () => navigate('/totem/tef-homologacao', { replace: true });
  const [transactions, setTransactions] = useState<TEFTransactionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filtros
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  
  // Carregar transações
  useEffect(() => {
    loadTransactions();
  }, []);
  
  const loadTransactions = () => {
    setIsRefreshing(true);

    // 1. Carregar do localStorage
    const storedTxns = getStoredTEFTransactions();

    // 2. Parsear dos logs do Android (se disponível)
    let parsedTxns: TEFTransactionRecord[] = [];
    if (isAndroidTEFAvailable()) {
      const logs = getLogsAndroid();
      parsedTxns = parseTransactionsFromAndroidLogs(logs);

      // Armazenar novas transações
      parsedTxns.forEach((txn) => {
        // só grava quando existe NSU Local/Host (PayGo) ou ordem
        if (txn.nsuLocal || txn.nsuHost || txn.ordemId) {
          storeTEFTransaction(txn);
        }
      });
    }

    // Combinar e remover duplicatas
    const uniqueTxns = mergeUniqueTEFTransactions(parsedTxns, storedTxns);
    setTransactions(uniqueTxns);

    setIsRefreshing(false);
  };
  
  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Filtro de data
      if (filterDate && !txn.date?.includes(filterDate) && !txn.timestamp?.includes(filterDate)) {
        return false;
      }
      
      // Filtro de status
      if (filterStatus !== 'all' && txn.status !== filterStatus) {
        return false;
      }
      
      // Filtro de busca (NSU, ordem, bandeira)
      if (filterSearch) {
        const search = filterSearch.toLowerCase();
        const matchNsu = txn.nsuLocal?.toLowerCase().includes(search);
        const matchOrdem = txn.ordemId?.toLowerCase().includes(search);
        const matchBandeira = txn.bandeira?.toLowerCase().includes(search);
        const matchAuth = txn.autorizacao?.toLowerCase().includes(search);
        if (!matchNsu && !matchOrdem && !matchBandeira && !matchAuth) {
          return false;
        }
      }
      
      return true;
    });
  }, [transactions, filterDate, filterStatus, filterSearch]);
  
  // Copiar NSU Local
  const copyNsuLocal = async (nsuLocal: string, id: string) => {
    try {
      await navigator.clipboard.writeText(nsuLocal);
      setCopiedId(id);
      toast.success('NSU Local copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      toast.error('Erro ao copiar');
    }
  };
  
  // Exportar para formato compatível com Excel
  const exportToCSV = () => {
    const headers = [
      'Passo/Teste',
      'NSU Local (terminalNsu)',
      'Data',
      'Hora',
      'Ordem ID',
      'Status',
      'Método',
      'Valor (R$)',
      'Bandeira',
      'Autorização',
      'Código Resposta',
      'Mensagem'
    ];
    
    const rows = filteredTransactions.map((txn, index) => [
      `Teste ${index + 1}`,
      txn.nsuLocal || '',
      txn.date || '',
      txn.time || '',
      txn.ordemId || '',
      txn.status || '',
      txn.metodo || '',
      txn.valor?.toFixed(2) || '',
      txn.bandeira || '',
      txn.autorizacao || '',
      txn.codigoResposta || '',
      txn.mensagem || ''
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEF_Homologacao_PayGo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado!', {
      description: 'Use os valores da coluna NSU Local para preencher a planilha PayGo'
    });
  };
  
  // Exportar apenas NSU Local (para copiar facilmente)
  const exportNsuList = () => {
    const nsuList = filteredTransactions
      .filter(txn => txn.nsuLocal)
      .map((txn, index) => `Passo ${index + 1}: ${txn.nsuLocal}`)
      .join('\n');
    
    const blob = new Blob([nsuList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSU_Local_Homologacao_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Lista de NSU exportada!');
  };
  
  // Limpar transações
  const clearTransactions = () => {
    localStorage.removeItem('tef_transactions_log');
    setTransactions([]);
    toast.success('Histórico limpo');
  };
  
  // Adicionar transação manual (para testes ou importação)
  const addManualTransaction = () => {
    const nsuLocal = prompt('Digite o NSU Local (terminalNsu):');
    if (!nsuLocal) return;
    
    const ordemId = prompt('Digite o ID da Ordem (opcional):') || `MANUAL_${Date.now()}`;
    const status = prompt('Status (aprovado/negado/cancelado):') || 'aprovado';
    
    const now = new Date();
    const transaction: TEFTransactionRecord = {
      id: `manual_${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR'),
      ordemId,
      nsuLocal,
      status: status as TEFTransactionRecord['status'],
    };
    
    storeTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    toast.success('Transação adicionada');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'erro': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 bg-gray-700 hover:bg-gray-600"
              onPointerDown={goBackToPDV}
              onClick={goBackToPDV}
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-urbana-gold" />
                Relatório TEF - Homologação PayGo
              </h1>
              <p className="text-xs text-gray-400">
                Dados para preencher a planilha de testes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBackToPDV}
              className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Voltar ao PDV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              disabled={isRefreshing}
              className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>
      
      {/* Info Box */}
      <div className="flex-shrink-0 bg-blue-900/30 border-b border-blue-500/30 px-3 py-2">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="text-blue-300 font-medium">
              Para preencher a planilha PayGo, use o valor da coluna "NSU Local"
            </p>
            <p className="text-blue-400/70 mt-0.5">
              Este valor corresponde ao campo <code className="bg-blue-900/50 px-1 rounded">saidaTransacao.obtemNsuLocal()</code> ou <code className="bg-blue-900/50 px-1 rounded">terminalNsu</code>
            </p>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex-shrink-0 bg-gray-800/50 px-3 py-2 border-b border-gray-700/50">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-500" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-7 w-32 text-xs bg-gray-800 border-gray-600"
              placeholder="Data"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-7 text-xs bg-gray-700 border border-gray-600 rounded px-2 text-white"
          >
            <option value="all">Todos</option>
            <option value="aprovado">Aprovados</option>
            <option value="negado">Negados</option>
            <option value="cancelado">Cancelados</option>
            <option value="erro">Erros</option>
          </select>
          
          <div className="flex items-center gap-1 flex-1 min-w-32">
            <Search className="h-3 w-3 text-gray-500" />
            <Input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-7 text-xs bg-gray-800 border-gray-600"
              placeholder="Buscar NSU, ordem..."
            />
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportNsuList}
              className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
            >
              <FileText className="h-3 w-3 mr-1" />
              NSUs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addManualTransaction}
              className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
            >
              + Manual
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTransactions}
              className="h-7 text-xs bg-red-900/50 text-red-400 hover:bg-red-900/70"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabela de Transações */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">Nenhuma transação encontrada</p>
                <p className="text-xs text-gray-500 mt-1">
                  Execute pagamentos de teste para ver os dados aqui
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addManualTransaction}
                  className="mt-4"
                >
                  Adicionar Manualmente
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header da tabela */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-800 rounded text-xs font-medium text-gray-400">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    NSU Local
                  </div>
                  <div className="col-span-2">Data/Hora</div>
                  <div className="col-span-2">Ordem ID</div>
                  <div className="col-span-1">Método</div>
                  <div className="col-span-1">Valor</div>
                  <div className="col-span-2">Status</div>
                </div>
                
                {/* Linhas */}
                {filteredTransactions.map((txn, index) => (
                  <Card 
                    key={txn.id} 
                    className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-1 text-gray-500 font-mono">
                          {index + 1}
                        </div>
                        
                        {/* NSU Local - CAMPO PRINCIPAL */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-1">
                            <code className="bg-urbana-gold/20 text-urbana-gold px-2 py-1 rounded font-bold text-sm">
                              {txn.nsuLocal || 'N/A'}
                            </code>
                            {txn.nsuLocal && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-gray-700 hover:bg-gray-600"
                                onClick={() => copyNsuLocal(txn.nsuLocal, txn.id)}
                              >
                                {copiedId === txn.id ? (
                                  <Check className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3 text-white" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Data/Hora */}
                        <div className="col-span-2 text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{txn.date}</span>
                          </div>
                          <span className="text-gray-500">{txn.time}</span>
                        </div>
                        
                        {/* Ordem ID */}
                        <div className="col-span-2 font-mono text-gray-300 truncate" title={txn.ordemId}>
                          {txn.ordemId?.slice(0, 15) || '-'}
                        </div>
                        
                        {/* Método */}
                        <div className="col-span-1">
                          <Badge variant="outline" className="text-[10px]">
                            {txn.metodo || '-'}
                          </Badge>
                        </div>
                        
                        {/* Valor */}
                        <div className="col-span-1 text-gray-300">
                          {txn.valor ? `R$ ${txn.valor.toFixed(2)}` : '-'}
                        </div>
                        
                        {/* Status */}
                        <div className="col-span-2">
                          <Badge className={`text-[10px] ${getStatusColor(txn.status)}`}>
                            {txn.status.toUpperCase()}
                          </Badge>
                          {txn.bandeira && (
                            <span className="ml-1 text-gray-500">{txn.bandeira}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Detalhes expandidos (opcional) */}
                      {(txn.autorizacao || txn.codigoResposta || txn.mensagem) && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50 text-[10px] text-gray-500 grid grid-cols-3 gap-2">
                          {txn.autorizacao && (
                            <span>Auth: {txn.autorizacao}</span>
                          )}
                          {txn.codigoResposta && (
                            <span>Código: {txn.codigoResposta}</span>
                          )}
                          {txn.mensagem && (
                            <span className="col-span-3 truncate">Msg: {txn.mensagem}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer com resumo */}
      <footer className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-gray-400">
            <span>{filteredTransactions.length} transações</span>
            <span className="text-green-400">
              {filteredTransactions.filter(t => t.status === 'aprovado').length} aprovadas
            </span>
            <span className="text-red-400">
              {filteredTransactions.filter(t => t.status === 'negado' || t.status === 'erro').length} negadas/erros
            </span>
          </div>
          
          <Button
            size="sm"
            onClick={exportToCSV}
            className="h-7 bg-urbana-gold text-urbana-black hover:bg-urbana-gold/90"
          >
            <Download className="h-3 w-3 mr-1" />
            Exportar para Planilha
          </Button>
        </div>
      </footer>
    </div>
  );
}

# Correção de Foreign Key - Tabela Vendas

## 🐛 Problema Identificado

O checkout estava falhando com o erro:
```
"Erro ao criar venda: insert or update on table \"vendas\" violates foreign key constraint \"vendas_cliente_id_fkey\""
```

## 🔍 Causa Raiz

A tabela `vendas` tinha uma foreign key `vendas_cliente_id_fkey` que apontava para **`painel_clientes_legacy`**, uma tabela que está **completamente vazia** (0 registros).

Enquanto isso:
- **`painel_agendamentos`** usa clientes de **`painel_clientes`** (view)
- **`painel_clientes`** é uma **view** que consulta **`client_profiles`** (tabela real)
- **`client_profiles`** tem **14 clientes** registrados

## 📊 Estrutura Descoberta

```
auth.users (tabela do Supabase Auth)
    ↓
client_profiles (tabela real - 14 registros)
    ↓
painel_clientes (view - dados combinados de client_profiles + auth.users)
    ↓
painel_agendamentos (usa cliente_id de painel_clientes)
    ↓
vendas (ERRO: estava tentando usar painel_clientes_legacy vazia!)
```

## ✅ Solução Aplicada

Migration executada para corrigir a foreign key:

```sql
-- 1. Remover constraint antiga (errada)
ALTER TABLE vendas 
DROP CONSTRAINT IF EXISTS vendas_cliente_id_fkey;

-- 2. Criar constraint correta
ALTER TABLE vendas 
ADD CONSTRAINT vendas_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES client_profiles(id) 
ON DELETE SET NULL;
```

## 🎯 Resultado

Agora a tabela `vendas` tem foreign key correta:
- **De**: `vendas.cliente_id`
- **Para**: `client_profiles.id`
- **Ação**: `ON DELETE SET NULL`

## 🧪 Teste Recomendado

1. Tente fazer checkout do Samuel novamente
2. Verifique se a venda é criada sem erros
3. Confirme que o pagamento é processado

## 📝 Cliente de Teste

- **Nome**: Samuel Cândido
- **ID**: `94dac6fc-ad9b-41ea-969c-680bb62bba97`
- **WhatsApp**: (27) 99277-5173
- **Agendamento**: `8b3adb86-e04f-4a29-b58b-4fc337b94ace`

---

**Data**: 2025-11-27  
**Status**: ✅ Correção aplicada com sucesso

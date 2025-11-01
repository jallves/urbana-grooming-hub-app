-- Adicionar coluna totem_session_id na tabela vendas
ALTER TABLE vendas 
ADD COLUMN totem_session_id UUID REFERENCES totem_sessions(id);

-- Criar índice para melhorar performance nas buscas
CREATE INDEX idx_vendas_totem_session_id ON vendas(totem_session_id);

-- Adicionar comentário explicando o uso da coluna
COMMENT ON COLUMN vendas.totem_session_id IS 'Referência à sessão do totem que gerou esta venda. Garante que cada checkout seja vinculado à sessão correta, evitando conflitos quando um cliente tem múltiplos agendamentos.';
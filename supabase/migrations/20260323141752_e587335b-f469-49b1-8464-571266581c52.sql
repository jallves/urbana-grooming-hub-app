
-- DELETE financial_records: produto/assinatura dia 21
DELETE FROM financial_records WHERE id = 'e58b61ab-cd8c-4af3-970f-94a9c6c5016c';

-- DELETE contas_pagar: comissões dia 21 (Barba) e dia 22
DELETE FROM contas_pagar WHERE id IN (
  '36304bb1-a280-431d-add5-77737c58d228',
  'c6b99fb6-e0e0-4fe8-953f-58b60a5252a1',
  'e59486d8-6005-437b-b133-9bd6e7038844'
);

-- DELETE contas_receber: produto assinatura dia 21, assinatura dia 22 e assinaturas abril
DELETE FROM contas_receber WHERE id IN (
  '9a4697cb-dcf4-481b-9000-f1a8e03bc0b9',
  '47d6260c-b2f1-4b9e-b49e-d0b75e3e79fe',
  'c989e56a-c415-46c4-99ab-8b5289a4c4c2',
  '221d081e-488f-4453-b3aa-1bde04276eef'
);

UPDATE painel_agendamentos 
SET cliente_id = 'ada01bde-1fcb-4909-ac81-3a359080de7a',
    painel_clientes = (SELECT jsonb_build_object('nome', nome, 'email', email, 'telefone', telefone, 'whatsapp', whatsapp) FROM painel_clientes WHERE id = 'ada01bde-1fcb-4909-ac81-3a359080de7a')
WHERE id = 'c88a2e72-61ad-4bcc-bb69-182c4ca41052';
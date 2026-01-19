-- Inserir avaliações iniciais de exemplo para validação da homepage
INSERT INTO public.appointment_ratings (rating, comment, created_at)
VALUES 
  (5, 'Excelente atendimento! Profissionais de primeira qualidade.', NOW() - INTERVAL '1 day'),
  (5, 'Corte perfeito, ambiente muito agradável. Recomendo!', NOW() - INTERVAL '2 days'),
  (4, 'Muito bom! Barbeiros atenciosos e cortesia no atendimento.', NOW() - INTERVAL '3 days'),
  (5, 'O melhor corte que já fiz. Voltarei com certeza!', NOW() - INTERVAL '4 days'),
  (5, 'Atendimento nota 10, equipe super profissional.', NOW() - INTERVAL '5 days'),
  (4, 'Gostei muito, ambiente limpo e organizado.', NOW() - INTERVAL '6 days'),
  (5, 'Simplesmente incrível! Barbeiro muito habilidoso.', NOW() - INTERVAL '1 week'),
  (5, 'Top demais! Minha barbearia favorita.', NOW() - INTERVAL '8 days'),
  (5, 'Serviço impecável do início ao fim.', NOW() - INTERVAL '9 days'),
  (4, 'Muito satisfeito com o resultado final.', NOW() - INTERVAL '10 days');
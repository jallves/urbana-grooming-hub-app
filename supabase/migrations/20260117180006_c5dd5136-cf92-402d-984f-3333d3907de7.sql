
-- Inserir 6 produtos de barbearia com estoque de 40 unidades cada
INSERT INTO painel_produtos (nome, descricao, preco, estoque, categoria, imagem_url, ativo)
VALUES 
  (
    'Shampoo para Barba',
    'Shampoo especial para limpeza e cuidado da barba. Fórmula suave que remove impurezas sem ressecar os fios.',
    45.90,
    40,
    'Cuidados com Barba',
    '/src/assets/products/shampoo-barba.jpg',
    true
  ),
  (
    'Condicionador para Barba',
    'Condicionador hidratante para barba. Deixa os fios macios, disciplinados e com brilho natural.',
    42.90,
    40,
    'Cuidados com Barba',
    '/src/assets/products/condicionador-barba.jpg',
    true
  ),
  (
    'Pós-Barba Balm',
    'Bálsamo pós-barba com ação calmante e hidratante. Alivia a irritação e protege a pele após o barbear.',
    38.90,
    40,
    'Cuidados com Barba',
    '/src/assets/products/pos-barba.jpg',
    true
  ),
  (
    'Pomada Modeladora',
    'Pomada para cabelo com fixação média. Ideal para criar estilos modernos com acabamento natural.',
    35.90,
    40,
    'Styling',
    '/src/assets/products/pomada-cabelo.jpg',
    true
  ),
  (
    'Óleo para Barba',
    'Óleo premium para barba com blend de óleos naturais. Nutre, hidrata e dá brilho saudável aos fios.',
    52.90,
    40,
    'Cuidados com Barba',
    '/src/assets/products/oleo-barba.jpg',
    true
  ),
  (
    'Cera para Cabelo',
    'Cera modeladora de alta fixação com acabamento matte. Perfeita para penteados elaborados que duram o dia todo.',
    39.90,
    40,
    'Styling',
    '/src/assets/products/cera-cabelo.jpg',
    true
  );

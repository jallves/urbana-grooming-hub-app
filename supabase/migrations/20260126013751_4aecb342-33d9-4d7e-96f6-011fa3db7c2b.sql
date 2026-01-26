
-- Corrigir o staff_id para usar auth.users.id (auth.uid())
-- Thomas Jefferson: auth.uid = e623e34b-2155-49a8-b9c7-16dd226a70d7
UPDATE public.painel_barbeiros
SET staff_id = 'e623e34b-2155-49a8-b9c7-16dd226a70d7'
WHERE email = 'ursocara2@gmail.com';

-- Carlos Firme: auth.uid = 2046b131-3170-4262-9c9e-96a42fdecd7e  
UPDATE public.painel_barbeiros
SET staff_id = '2046b131-3170-4262-9c9e-96a42fdecd7e'
WHERE email = 'studiocarlosfirme@gmail.com';

-- Também atualizar a tabela staff para manter consistência (o campo staff_id lá também deve ser auth.uid)
UPDATE public.staff
SET staff_id = 'e623e34b-2155-49a8-b9c7-16dd226a70d7'
WHERE email = 'ursocara2@gmail.com';

UPDATE public.staff
SET staff_id = '2046b131-3170-4262-9c9e-96a42fdecd7e'
WHERE email = 'studiocarlosfirme@gmail.com';

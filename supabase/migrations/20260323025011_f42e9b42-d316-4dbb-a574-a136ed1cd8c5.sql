-- =====================================================
-- LIMPEZA DE DADOS DE TESTE - MARÇO 2026
-- MANTER: Mateus Corrêa Vasco (14/03), Carlos Felix (14/03),
--         João Alves 10h e 10h30 (21/03),
--         Fábio Coutinho e Rafael Machado Freitas (28/03)
-- APAGAR: João Alves 15:30 (21/03) + TODOS os 22/03
-- =====================================================

-- 1. Deletar subscription_usage (João Alves)
DELETE FROM subscription_usage WHERE id IN (
  'a0df21bf-b46f-4676-b115-5bd2db1d62db',
  'dcdeac9b-6620-4d43-9e18-046f76a2c520',
  '515287b4-8e53-4ebe-9b04-56c849362232',
  'b7ed6155-cb48-4510-8a0a-d031284ca847',
  'f6ee6d18-2cb0-4699-b399-69a65e5dbaa6',
  'e98fadac-725f-4e29-8c4f-714340878438',
  '53b284c1-e290-4481-8e91-c1800d0c62be',
  '11404048-4d35-4322-aae7-41a64133e637',
  '2897d08f-420a-4747-b9e6-92437c2feecb',
  '412f039d-d4c2-4553-a29c-04c660f4b90c',
  '0c5605d1-d27c-4b93-9203-38290696f916',
  'e1bb29ce-5784-41c6-ad43-f798faa27b44'
);

-- 2. Deletar subscription_payments (João Alves)
DELETE FROM subscription_payments WHERE id IN (
  '3325c9d7-829c-4111-8421-c3e8707d498d',
  '35a4afb3-15da-43fd-80c5-c6bfdce29874',
  '09d4fd4b-6118-4135-a925-7e7d92160a4f'
);

-- 3. Deletar client_subscriptions (João Alves) - manter o plano
DELETE FROM client_subscriptions WHERE id = '39cb5780-c16a-40fd-94ce-4c7cd56115b1';

-- 4. Deletar appointment_totem_sessions
DELETE FROM appointment_totem_sessions WHERE appointment_id IN (
  '05bb77c5-0d73-408f-97f8-e683f377c568',
  'a0698b91-da3d-4ae9-88b8-1429b9941fe7','f38f09c8-5839-48ed-b76f-49595294141d',
  '46ec690a-b2c4-430d-b4aa-6770e1f535eb','0ff401fb-8fef-41b3-a68c-422b68db97aa',
  '12c0ed4c-42b1-48d9-ae21-2112cd186b58','13979589-5e60-4443-98db-e8da268efb60',
  '9efd66d6-9c79-4991-88d9-c08102bfb578','a3256194-2ca1-41a3-8283-701a9c34e847',
  'c396d059-d3db-4b2a-a565-81878b65e39b','37562792-a009-4319-a4d8-33a1db303d39',
  '96c7bb21-f99c-4b12-880c-8c511568bf2d','ea663a0e-babb-4c6f-86f0-845a6f894c46',
  '8d7cf35e-e59a-441f-b40e-911cd9c706b2','cdea0c35-2697-4756-9956-4cf3577b6a15',
  '5c9c6081-a86c-4f64-b563-0d5295595c94','281a70f5-4f4b-45e8-957e-186b0a152007',
  '16087d4b-bc0b-41ad-83e5-49c27a47844d'
);

-- 5. Deletar barber_commissions
DELETE FROM barber_commissions WHERE id IN (
  'ce972015-dc0a-458f-a462-b33a668225f9',
  'd5f8099a-9b5a-43d5-bae3-cb9b182e8542','04fcb2e3-fb88-4124-812b-e33f71446d75',
  'ad8f04dd-306c-4063-93c3-1d05b92dbee1','48ccd153-d918-4306-aceb-46112f7ff5a2',
  '200729de-6b24-41cf-9325-7f97b516b7e9','e1696736-bb21-43ba-9b35-be5d7fcce306',
  '95160ee8-b4ec-49b4-b1f9-49e6d96fb3e7','e8244ea2-2197-46ff-ab72-b85171558882',
  '37ba8bcd-a6b2-4fa4-a879-e682ecddec36','7d65a086-4a64-4c26-85b7-8d77ec6696a0',
  '780c17a9-1aa8-4bc1-9bf4-77561962ab80','1ac52892-d5e4-46cc-8e83-6b36ea88e566',
  '994b64be-958f-4f7a-97f7-43b42861393b','f9839e2a-9208-4897-bf94-3e4f1ae6e2be',
  'd14507d0-a9aa-4111-bcbe-cf3382cf738f'
);

-- 6. Deletar financial_records
DELETE FROM financial_records WHERE reference_id IN (
  '34cc10d2-3266-4424-a7fa-ecd3113815aa',
  'dad7122f-b9bb-42dc-977e-7e26cc9e3a9e','2750b07d-648d-4c20-a2a0-6a56fb087038',
  '36e37966-a12e-4a0b-a54b-c2b70898db17','aab005fe-3f99-4a72-bd34-2db3c01ea848',
  '66e6188d-9047-4501-8d77-e37052ce97d3','e3def32a-d627-4285-9d52-0c52247cf981',
  '362c4afc-2249-45f1-bae2-745ef453acd2','b7a6b235-b908-4f8a-8c6b-497a235b7a86',
  '64d20be3-ee8b-4751-94dc-edda93953e20','a3ca884b-1247-4291-9eae-6c72f9b76ad6',
  '0e576c8c-c834-4f78-93c0-4f32cd3c388f','4a2bc2bb-01fb-4ab9-ba60-89e26faa0c47',
  '7b1e19b4-7de3-4518-ac3d-ad01790860b5','d331e11b-8083-4a50-93ff-73a353cbb32f',
  'acbfcb4b-c023-4a13-aa85-ca58defb22b7','a1d4bc0c-3206-4cff-be8a-f0617f2980bf',
  '0bcb0f22-bf70-4b4e-bd93-26f86e168810'
);

-- 7. Deletar contas_receber (créditos assinatura + admin checkouts + cortesias)
DELETE FROM contas_receber WHERE id IN (
  '5ef1ecfc-90e3-424f-aa8e-8b05f9fc95b4',
  'c19dfd76-917e-4476-aba1-2b5ffe436471',
  '89d74407-f684-43cc-baa0-ce1c0b44cb3b',
  '72da90dd-7a5f-45f5-9e04-e54a0c893f73',
  'dea95102-a58f-483f-9bec-d878858698b1',
  'fb79eec9-4250-47c7-b1ac-ba1c3d00e316',
  '573d9bb0-c0cc-4406-8ca0-5fc46ec0e934',
  '98c78530-d10d-4a09-85e0-cb4c6cb2cfda',
  '4fc00eea-3199-4739-9b96-f4a7eaa5f666',
  'a6e9d02c-4d42-48db-8cc6-b2e6c31ebb92',
  'f3f583ec-d65a-4e0b-b20e-5afe4481e5df',
  '210390bf-c08f-4945-8def-83c804527ace',
  '84fffdcb-76be-47d5-973b-adef2bd93543',
  '207e8140-43d9-4443-be8d-773b5a709104',
  '06e972fe-fe80-4393-8fb4-0603ddb4fab0',
  '59dad257-2b53-45ab-ba0f-5a2605e81b0d',
  '150f25bb-a9c4-48b5-83d7-0eb89e37ce43'
);

-- 8. Deletar contas_pagar (comissões crédito + admin + cortesia)
DELETE FROM contas_pagar WHERE id IN (
  'dd4d9ae7-ce83-458c-ab84-4451e7d099aa',
  '1507d5d2-8e92-4f04-92b3-4db0da256000',
  'ed973511-30e8-4db1-ae54-bfb6715a537f',
  '7f6bdd87-0ae3-41dd-bcbb-396dc58db9e9',
  '9d22bbb8-f392-4d40-95ae-9d33184a2f10',
  '5b8980c4-75cf-47ce-bc6f-47dc4b854bd2',
  'dabba92a-9ef7-47dd-8182-8849c4d0757d',
  '9fcb3226-1372-4dfe-af4e-12a0fbf84f0b',
  '25b0db53-969b-4e5f-943a-9b5364173d9d',
  'e4b84239-86c7-4bc4-bbce-a88b4b701959',
  '435f85a0-0be3-4210-b0d7-a3a5d2a91336',
  '2d0844a9-fc70-4127-ba60-bd7b19084629',
  'b562dc2f-ae89-454d-8b39-b1c9bbdf1776',
  'f6a731a1-cef9-450f-9b31-790763c3a7d2'
);

-- 9. Deletar cash_flow
DELETE FROM cash_flow WHERE id IN (
  'f615c17e-2d56-467d-a9d3-e8ef3134bbd7',
  'c38af36d-2d78-4449-8388-4907c2ffefd1',
  'ffb17496-e526-44cd-8767-71e9d98a7b80',
  'eb2d2a68-af2e-4e5e-9a53-a0a781579b4c',
  'ccc0d4c1-a5c7-42fa-aa32-afd98cc8de1e',
  '1459ed62-d948-43f8-b19d-08e7d2a27098'
);

-- 10. Deletar comissoes (tabela legada)
DELETE FROM comissoes WHERE venda_id IN (
  '34cc10d2-3266-4424-a7fa-ecd3113815aa',
  'dad7122f-b9bb-42dc-977e-7e26cc9e3a9e','2750b07d-648d-4c20-a2a0-6a56fb087038',
  '36e37966-a12e-4a0b-a54b-c2b70898db17','aab005fe-3f99-4a72-bd34-2db3c01ea848',
  '66e6188d-9047-4501-8d77-e37052ce97d3','e3def32a-d627-4285-9d52-0c52247cf981',
  '362c4afc-2249-45f1-bae2-745ef453acd2','b7a6b235-b908-4f8a-8c6b-497a235b7a86',
  '64d20be3-ee8b-4751-94dc-edda93953e20','a3ca884b-1247-4291-9eae-6c72f9b76ad6',
  '0e576c8c-c834-4f78-93c0-4f32cd3c388f','4a2bc2bb-01fb-4ab9-ba60-89e26faa0c47',
  '7b1e19b4-7de3-4518-ac3d-ad01790860b5','d331e11b-8083-4a50-93ff-73a353cbb32f',
  'acbfcb4b-c023-4a13-aa85-ca58defb22b7','a1d4bc0c-3206-4cff-be8a-f0617f2980bf',
  '0bcb0f22-bf70-4b4e-bd93-26f86e168810'
);

-- 11. Deletar vendas (precisa ser após barber_commissions e painel_agendamentos update)
-- Primeiro, desvincula os agendamentos das vendas
UPDATE painel_agendamentos SET venda_id = NULL WHERE id IN (
  '05bb77c5-0d73-408f-97f8-e683f377c568',
  'a0698b91-da3d-4ae9-88b8-1429b9941fe7','f38f09c8-5839-48ed-b76f-49595294141d',
  '46ec690a-b2c4-430d-b4aa-6770e1f535eb','0ff401fb-8fef-41b3-a68c-422b68db97aa',
  '12c0ed4c-42b1-48d9-ae21-2112cd186b58','13979589-5e60-4443-98db-e8da268efb60',
  '9efd66d6-9c79-4991-88d9-c08102bfb578','a3256194-2ca1-41a3-8283-701a9c34e847',
  'c396d059-d3db-4b2a-a565-81878b65e39b','37562792-a009-4319-a4d8-33a1db303d39',
  '96c7bb21-f99c-4b12-880c-8c511568bf2d','ea663a0e-babb-4c6f-86f0-845a6f894c46',
  '8d7cf35e-e59a-441f-b40e-911cd9c706b2','cdea0c35-2697-4756-9956-4cf3577b6a15',
  '5c9c6081-a86c-4f64-b563-0d5295595c94','281a70f5-4f4b-45e8-957e-186b0a152007',
  '16087d4b-bc0b-41ad-83e5-49c27a47844d'
);

-- Agora deleta as vendas
DELETE FROM vendas WHERE id IN (
  '34cc10d2-3266-4424-a7fa-ecd3113815aa',
  'dad7122f-b9bb-42dc-977e-7e26cc9e3a9e','2750b07d-648d-4c20-a2a0-6a56fb087038',
  '36e37966-a12e-4a0b-a54b-c2b70898db17','aab005fe-3f99-4a72-bd34-2db3c01ea848',
  '66e6188d-9047-4501-8d77-e37052ce97d3','e3def32a-d627-4285-9d52-0c52247cf981',
  '362c4afc-2249-45f1-bae2-745ef453acd2','b7a6b235-b908-4f8a-8c6b-497a235b7a86',
  '64d20be3-ee8b-4751-94dc-edda93953e20','a3ca884b-1247-4291-9eae-6c72f9b76ad6',
  '0e576c8c-c834-4f78-93c0-4f32cd3c388f','4a2bc2bb-01fb-4ab9-ba60-89e26faa0c47',
  '7b1e19b4-7de3-4518-ac3d-ad01790860b5','d331e11b-8083-4a50-93ff-73a353cbb32f',
  'acbfcb4b-c023-4a13-aa85-ca58defb22b7','a1d4bc0c-3206-4cff-be8a-f0617f2980bf',
  '0bcb0f22-bf70-4b4e-bd93-26f86e168810'
);

-- 12. Deletar agendamentos
DELETE FROM painel_agendamentos WHERE id IN (
  '05bb77c5-0d73-408f-97f8-e683f377c568',
  'a0698b91-da3d-4ae9-88b8-1429b9941fe7','f38f09c8-5839-48ed-b76f-49595294141d',
  '46ec690a-b2c4-430d-b4aa-6770e1f535eb','0ff401fb-8fef-41b3-a68c-422b68db97aa',
  '12c0ed4c-42b1-48d9-ae21-2112cd186b58','13979589-5e60-4443-98db-e8da268efb60',
  '9efd66d6-9c79-4991-88d9-c08102bfb578','a3256194-2ca1-41a3-8283-701a9c34e847',
  'c396d059-d3db-4b2a-a565-81878b65e39b','37562792-a009-4319-a4d8-33a1db303d39',
  '96c7bb21-f99c-4b12-880c-8c511568bf2d','ea663a0e-babb-4c6f-86f0-845a6f894c46',
  '8d7cf35e-e59a-441f-b40e-911cd9c706b2','cdea0c35-2697-4756-9956-4cf3577b6a15',
  '5c9c6081-a86c-4f64-b563-0d5295595c94','281a70f5-4f4b-45e8-957e-186b0a152007',
  '16087d4b-bc0b-41ad-83e5-49c27a47844d'
);
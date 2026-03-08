DELETE FROM subscription_payments;
DELETE FROM client_subscriptions;
DELETE FROM subscription_plan_services;
DELETE FROM subscription_plans;
DELETE FROM contas_receber WHERE categoria = 'Assinatura';
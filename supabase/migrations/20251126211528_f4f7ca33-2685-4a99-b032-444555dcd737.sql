-- ============================================
-- PARTE 1: ADICIONAR ROLE 'CLIENT' AO ENUM
-- ============================================

-- Adicionar 'client' ao enum de roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
-- Migration: seed admin user
-- Creates admin@cvvpro.com with SUPER_ADMIN role and PRO plan
-- Password: admin1234 (bcrypt, 12 rounds)

INSERT INTO "User" (
  id,
  name,
  email,
  password,
  role,
  plan,
  "subscriptionStatus",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'Admin CVV Pro',
  'admin@cvvpro.com',
  '$2b$12$gd59d6vdIZijKYx3t/Z.TOlxhr39QDbaOoOH100znkquGyyi1qddS',
  'SUPER_ADMIN',
  'PRO',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
  SET role               = 'SUPER_ADMIN',
      plan               = 'PRO',
      "subscriptionStatus" = 'ACTIVE',
      "updatedAt"        = NOW();

-- 🔧 Script de Correction pour Compte Existant
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que l'utilisateur existe
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Vérifier si le profil existe
SELECT p.id, p.user_id, p.email, p.full_name
FROM public.profiles p
INNER JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Si le profil manque, créer manuellement le profil pour TOUS les utilisateurs sans profil
INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Utilisateur'),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 4. Créer les rôles pour tous les utilisateurs sans rôle
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Confirmer l'email si pas confirmé (pour dev uniquement)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 6. Vérification finale
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

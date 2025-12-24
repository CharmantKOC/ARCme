-- ⚡ Script Rapide - Correction Compte Existant
-- Copier et exécuter dans Supabase SQL Editor

-- Version 1: Créer le profil pour votre email spécifique
-- ⚠️ REMPLACER 'votre-email@example.com' par votre vraie adresse email

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'votre-email@example.com'; -- ⚠️ CHANGER ICI
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec cet email';
  END IF;
  
  -- Créer ou mettre à jour le profil
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (v_user_id, 'votre-email@example.com', 'Mon Nom') -- ⚠️ CHANGER ICI
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;
  
  -- Créer le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Confirmer l'email
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_user_id AND email_confirmed_at IS NULL;
  
  RAISE NOTICE 'Profil créé avec succès pour %', v_user_id;
END $$;

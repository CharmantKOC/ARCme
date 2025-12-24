-- Fix RLS policy for user_roles to allow users to self-assign alumni role
-- This allows users to become alumni when they upload a document

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert alumni role for themselves" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Allow users to insert the 'alumni' role for themselves
CREATE POLICY "Users can self-assign alumni role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND role = 'alumni'
);

-- Allow users to view their own roles (if not already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles" 
    ON public.user_roles FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

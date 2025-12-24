-- Add contact fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'email' CHECK (preferred_contact IN ('email', 'phone', 'linkedin', 'website'));

-- Comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'Phone number for contact';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.website_url IS 'Personal or professional website URL';
COMMENT ON COLUMN public.profiles.preferred_contact IS 'Preferred method of contact (email, phone, linkedin, website)';

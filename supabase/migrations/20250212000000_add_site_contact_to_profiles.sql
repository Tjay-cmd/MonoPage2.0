-- Add site contact fields to profiles for runtime placeholder replacement in templates.
-- These values replace __BUSINESS_NAME__, __PHONE__, __EMAIL__, __ADDRESS__, __WHATSAPP__ in published sites.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS site_phone text,
  ADD COLUMN IF NOT EXISTS site_email text,
  ADD COLUMN IF NOT EXISTS site_address text,
  ADD COLUMN IF NOT EXISTS site_whatsapp text;

COMMENT ON COLUMN profiles.site_phone IS 'Phone number displayed on website (e.g. +27 12 345 6789)';
COMMENT ON COLUMN profiles.site_email IS 'Email displayed on website for contact';
COMMENT ON COLUMN profiles.site_address IS 'Business address displayed on website';
COMMENT ON COLUMN profiles.site_whatsapp IS 'WhatsApp number for wa.me link (digits only, e.g. 27123456789)';

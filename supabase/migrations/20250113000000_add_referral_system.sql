-- Add referral system to the database
-- This migration adds referral tracking to give users bonus credits when they refer others

-- Add referral columns to user_credits table
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS referral_credits_earned INTEGER DEFAULT 0;

-- Create referrals log table to track all referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    credits_awarded INTEGER DEFAULT 5,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(referred_id) -- Each user can only be referred once
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals they made" ON public.referrals;

-- Create policies for referrals
CREATE POLICY "Users can view referrals they made"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals as referred"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referred_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS user_credits_referral_code_idx ON public.user_credits(referral_code);

-- Function to generate a unique referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle referral code generation for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    -- Generate a unique referral code
    LOOP
        new_code := public.generate_referral_code();
        SELECT EXISTS(SELECT 1 FROM public.user_credits WHERE referral_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    -- Update the user_credits record with the referral code
    UPDATE public.user_credits 
    SET referral_code = new_code 
    WHERE user_id = NEW.user_id AND referral_code IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate referral codes
DROP TRIGGER IF EXISTS on_user_credits_created ON public.user_credits;
CREATE TRIGGER on_user_credits_created
    AFTER INSERT ON public.user_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_referral_code();

-- Generate referral codes for existing users who don't have one
DO $$
DECLARE
    user_record RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR user_record IN SELECT user_id FROM public.user_credits WHERE referral_code IS NULL LOOP
        LOOP
            new_code := public.generate_referral_code();
            SELECT EXISTS(SELECT 1 FROM public.user_credits WHERE referral_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        UPDATE public.user_credits SET referral_code = new_code WHERE user_id = user_record.user_id;
    END LOOP;
END $$;

-- Comment on the referral system
COMMENT ON TABLE public.referrals IS '
Referral System:
- Each user gets a unique referral code upon signup
- When a new user signs up using a referral link, both get credited:
  - Referrer gets 5 bonus credits
  - New user starts with their normal credits
- Referral codes are 8 characters (alphanumeric)
- Each user can only be referred once
';

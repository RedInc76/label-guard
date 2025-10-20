-- Create profiles table for user profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_profile_name_per_user UNIQUE (user_id, name)
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_active ON public.profiles(user_id, is_active) WHERE is_active = true;

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for profile limit (max 5 per user)
CREATE OR REPLACE FUNCTION public.check_profile_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 profiles per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_limit();

-- Table for profile restrictions
CREATE TABLE public.profile_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  
  CONSTRAINT unique_restriction_per_profile UNIQUE (profile_id, restriction_id)
);

CREATE INDEX idx_profile_restrictions_profile ON public.profile_restrictions(profile_id);

ALTER TABLE public.profile_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile restrictions"
  ON public.profile_restrictions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_restrictions.profile_id 
    AND profiles.user_id = auth.uid()
  ));

-- Table for custom restrictions
CREATE TABLE public.profile_custom_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_custom_per_profile UNIQUE (profile_id, restriction_text)
);

CREATE INDEX idx_custom_restrictions_profile ON public.profile_custom_restrictions(profile_id);

ALTER TABLE public.profile_custom_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom restrictions"
  ON public.profile_custom_restrictions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_custom_restrictions.profile_id 
    AND profiles.user_id = auth.uid()
  ));

-- Table for scan history
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  barcode TEXT,
  product_name TEXT NOT NULL,
  brands TEXT,
  image_url TEXT,
  
  is_compatible BOOLEAN NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  violations JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  
  ingredients_text TEXT,
  allergens TEXT,
  
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('barcode', 'ai_photo')),
  active_profiles_snapshot JSONB NOT NULL,
  
  front_photo_url TEXT,
  back_photo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_history_user ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_date ON public.scan_history(created_at DESC);
CREATE INDEX idx_scan_history_type ON public.scan_history(user_id, analysis_type);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan history"
  ON public.scan_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history"
  ON public.scan_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan history"
  ON public.scan_history FOR DELETE
  USING (auth.uid() = user_id);

-- Table for favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_history_id UUID REFERENCES public.scan_history(id) ON DELETE CASCADE,
  
  product_name TEXT NOT NULL,
  brands TEXT,
  image_url TEXT,
  barcode TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_favorite_per_user UNIQUE (user_id, scan_history_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_created ON public.favorites(user_id, created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
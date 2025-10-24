-- Create table for AI analyzed products cache
CREATE TABLE public.ai_analyzed_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  product_name TEXT NOT NULL,
  brands TEXT,
  ingredients_text TEXT,
  allergens TEXT,
  front_photo_url TEXT,
  back_photo_url TEXT,
  image_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  times_accessed INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_ai_analyzed_products_barcode ON public.ai_analyzed_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_ai_analyzed_products_product_name ON public.ai_analyzed_products(product_name);
CREATE INDEX idx_ai_analyzed_products_last_accessed ON public.ai_analyzed_products(last_accessed_at DESC);

-- Enable RLS
ALTER TABLE public.ai_analyzed_products ENABLE ROW LEVEL SECURITY;

-- Policy: All users can read cached products (shared cache for efficiency)
CREATE POLICY "All users can read cached products"
ON public.ai_analyzed_products
FOR SELECT
USING (true);

-- Policy: Users can insert their own analyzed products
CREATE POLICY "Users can insert their own analyzed products"
ON public.ai_analyzed_products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyzed products
CREATE POLICY "Users can update their own analyzed products"
ON public.ai_analyzed_products
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyzed products
CREATE POLICY "Users can delete their own analyzed products"
ON public.ai_analyzed_products
FOR DELETE
USING (auth.uid() = user_id);
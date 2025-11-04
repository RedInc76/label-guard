-- Create error_reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  error_category TEXT NOT NULL CHECK (error_category IN (
    'wrong_product',
    'wrong_ingredients',
    'false_positive',
    'false_negative',
    'other'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'requires_verification',
    'resolved',
    'dismissed'
  )),
  barcode TEXT,
  product_name TEXT NOT NULL,
  user_description TEXT,
  admin_id UUID,
  admin_notes TEXT,
  analysis_snapshot JSONB,
  active_profiles_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  cache_cleared_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX idx_error_reports_status ON public.error_reports(status);
CREATE INDEX idx_error_reports_barcode ON public.error_reports(barcode);
CREATE INDEX idx_error_reports_created_at ON public.error_reports(created_at DESC);
CREATE INDEX idx_error_reports_admin_id ON public.error_reports(admin_id);

-- Enable RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can create their own reports"
ON public.error_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for admins
CREATE POLICY "Admins can view all reports"
ON public.error_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all reports"
ON public.error_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_error_reports_updated_at
BEFORE UPDATE ON public.error_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
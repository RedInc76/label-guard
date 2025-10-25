-- Create rate limiting table for AI analysis
CREATE TABLE public.ai_analysis_rate_limit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_analysis_rate_limit
ALTER TABLE public.ai_analysis_rate_limit ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_ai_analysis_rate_limit_user_window ON public.ai_analysis_rate_limit(user_id, window_start);

-- Create rate limiting table for OTP requests
CREATE TABLE public.otp_rate_limit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on otp_rate_limit
ALTER TABLE public.otp_rate_limit ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_otp_rate_limit_email_window ON public.otp_rate_limit(email, window_start);
CREATE INDEX idx_otp_rate_limit_ip_window ON public.otp_rate_limit(ip_address, window_start);

-- Policies to deny all public access (only edge functions with service role can access)
CREATE POLICY "Deny all public access to ai_analysis_rate_limit" 
ON public.ai_analysis_rate_limit 
FOR ALL 
USING (false);

CREATE POLICY "Deny all public access to otp_rate_limit" 
ON public.otp_rate_limit 
FOR ALL 
USING (false);

-- Function to cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up AI analysis rate limits older than 24 hours
  DELETE FROM public.ai_analysis_rate_limit
  WHERE window_start < now() - INTERVAL '24 hours';
  
  -- Clean up OTP rate limits older than 24 hours
  DELETE FROM public.otp_rate_limit
  WHERE window_start < now() - INTERVAL '24 hours';
  
  -- Clean up expired OTP codes older than 1 hour
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;
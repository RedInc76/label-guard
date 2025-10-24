-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only admins can manage roles)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_logging_config table
CREATE TABLE public.user_logging_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  logging_enabled BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_logging_config
ALTER TABLE public.user_logging_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_logging_config
CREATE POLICY "Admins can manage logging config"
ON public.user_logging_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own logging config"
ON public.user_logging_config
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create application_logs table
CREATE TABLE public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_type TEXT NOT NULL, -- 'error', 'action', 'navigation', 'scan', etc.
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_application_logs_user_id ON public.application_logs(user_id);
CREATE INDEX idx_application_logs_created_at ON public.application_logs(created_at DESC);
CREATE INDEX idx_application_logs_log_type ON public.application_logs(log_type);

-- Enable RLS on application_logs
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_logs
CREATE POLICY "Users can insert their own logs"
ON public.application_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
ON public.application_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to check if logging is enabled for a user
CREATE OR REPLACE FUNCTION public.is_logging_enabled(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT logging_enabled FROM public.user_logging_config WHERE user_id = _user_id),
    false
  )
$$;

-- Trigger to update updated_at on user_logging_config
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_logging_config_updated_at
BEFORE UPDATE ON public.user_logging_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
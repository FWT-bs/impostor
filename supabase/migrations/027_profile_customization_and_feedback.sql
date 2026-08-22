-- Profile customization fields + a feedback inbox for the contact form.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS favorite_pack text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 160) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_bio_length;

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text,
  email text,
  category text NOT NULL DEFAULT 'feedback'
    CHECK (category IN ('bug', 'feedback', 'support', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can submit feedback; nobody can read it back
-- through the public API — only the service role (Supabase dashboard) can.
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT
  WITH CHECK (char_length(message) BETWEEN 1 AND 2000);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

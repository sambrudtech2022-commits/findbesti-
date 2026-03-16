-- Tighten profile update policy with explicit post-update check
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tighten conversations update policy and prevent participant rewrites
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
ON public.conversations
FOR UPDATE
TO public
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id))
WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

CREATE OR REPLACE FUNCTION public.protect_conversation_participants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user1_id IS DISTINCT FROM OLD.user1_id
     OR NEW.user2_id IS DISTINCT FROM OLD.user2_id THEN
    RAISE EXCEPTION 'Conversation participants cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conversation_participants_trigger ON public.conversations;
CREATE TRIGGER protect_conversation_participants_trigger
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.protect_conversation_participants();
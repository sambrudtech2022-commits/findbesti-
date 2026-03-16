
-- Attach protect_profile_sensitive_fields trigger
CREATE TRIGGER trg_protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- Attach protect_conversation_participants trigger
CREATE TRIGGER trg_protect_conversation_participants
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conversation_participants();

-- Attach generate_referral_code trigger
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Attach add_coins_on_task_completion trigger
CREATE TRIGGER trg_add_coins_on_task_completion
  AFTER INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.add_coins_on_task_completion();

-- Attach update_conversation_last_message trigger
CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Attach cleanup_expired_otps trigger
CREATE TRIGGER trg_cleanup_expired_otps
  AFTER INSERT ON public.otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_expired_otps();

-- Attach update_updated_at_column triggers
CREATE TRIGGER trg_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_withdrawal_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_premium_sub_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

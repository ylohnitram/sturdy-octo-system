--  Znehodnocuje použité kódy.
CREATE OR REPLACE FUNCTION public.claim_invite_code()
RETURNS trigger AS $$
DECLARE
  code_val text;
BEGIN
  code_val := new.raw_user_meta_data->>'invite_code';

  IF exists (select 1 from public.beta_codes where code = code_val) THEN
     IF exists (select 1 from public.beta_codes where code = code_val and is_claimed = true) THEN
        RAISE EXCEPTION 'Invite code has already been claimed.';
     END IF;
     UPDATE public.beta_codes SET is_claimed = true WHERE code = code_val;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_claim_code ON auth.users;
CREATE TRIGGER on_auth_user_created_claim_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.claim_invite_code();
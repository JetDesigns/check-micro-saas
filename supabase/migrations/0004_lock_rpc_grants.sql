-- Advisor security warn (post-0003): spend_credit & add_credits masih callable
-- oleh role `anon` via /rest/v1/rpc/*. add_credits khususnya bahaya karena
-- security definer + service role — anon tak boleh punya path ke sana sama
-- sekali. Explicit revoke dari PUBLIC + anon + authenticated menutup jalur
-- inheritance-nya.

revoke execute on function public.add_credits(uuid, integer, text)
  from public, anon, authenticated;

revoke execute on function public.spend_credit(uuid)
  from public, anon;
-- authenticated tetap bisa spend_credit — itu memang alurnya.

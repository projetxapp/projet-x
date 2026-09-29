-- =============================================================================
-- Push notifications: every new (or bumped) unread notification is handed to the
-- `push` Edge Function through pg_net. The function claims it (exactly-once per
-- update, see claim_notification_push), sends it with the Expo Push API and
-- forgets dead tokens.
-- Disabled until private.app_settings has 'push_function_url' (set per environment).
-- =============================================================================

create extension if not exists pg_net with schema extensions;

create or replace function private.dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_key text;
begin
  if new.read then
    return null;
  end if;
  if tg_op = 'UPDATE' and new.created_at is not distinct from old.created_at then
    return null;
  end if;

  select value into v_url from private.app_settings where key = 'push_function_url';
  if v_url is null then
    return null;
  end if;
  select value into v_key from private.app_settings where key = 'push_function_key';

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json')
               || case when v_key is null then '{}'::jsonb
                       else jsonb_build_object('Authorization', 'Bearer ' || v_key) end,
    timeout_milliseconds := 5000
  );
  return null;
exception when others then
  raise warning 'push dispatch failed for notification %: %', new.id, sqlerrm;
  return null;
end $$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push after insert or update of created_at on public.notifications
  for each row execute function private.dispatch_push();

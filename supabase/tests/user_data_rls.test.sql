begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'rls-user-one@example.test', now(), '{"full_name":"RLS User One","username":"duplicate_handle"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'rls-user-two@example.test', now(), '{"full_name":"RLS User Two","username":"duplicate_handle"}'::jsonb);

select extensions.is(
  (select count(*)::int from public.profiles
   where id = '22222222-2222-4222-8222-222222222222' and username is null),
  1,
  'a duplicate optional username does not prevent profile creation'
);

insert into public.farm_settings (id, farm_name)
values ('11111111-1111-4111-8111-111111111111', 'Private farm');
insert into public.crops (user_id, crop_name)
values ('11111111-1111-4111-8111-111111111111', 'Private crop');
insert into public.farm_tasks (user_id, title)
values ('11111111-1111-4111-8111-111111111111', 'Private task');

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
set local role authenticated;
select extensions.is((select count(*)::int from public.profiles), 1, 'a user can read their own profile');

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select extensions.is((select count(*)::int from public.profiles), 1, 'a user cannot read another profile');
select extensions.is((select count(*)::int from public.farm_settings), 0, 'a user cannot read another farm setting');
select extensions.is((select count(*)::int from public.crops), 0, 'a user cannot read another crop');
select extensions.is((select count(*)::int from public.farm_tasks), 0, 'a user cannot read another task');
select extensions.is(
  (with changed as (
    update public.farm_settings set farm_name = 'Unauthorized change'
    where id = '11111111-1111-4111-8111-111111111111'
    returning 1
  ) select count(*)::int from changed),
  0,
  'a user cannot update another farm setting'
);
select extensions.is(
  (with changed as (
    update public.crops set crop_name = 'Unauthorized change'
    where user_id = '11111111-1111-4111-8111-111111111111'
    returning 1
  ) select count(*)::int from changed),
  0,
  'a user cannot update another crop'
);
select extensions.is(
  (with changed as (
    update public.farm_tasks set title = 'Unauthorized change'
    where user_id = '11111111-1111-4111-8111-111111111111'
    returning 1
  ) select count(*)::int from changed),
  0,
  'a user cannot update another task'
);
select extensions.is(
  (with changed as (
    update public.profiles set full_name = 'Unauthorized change'
    where id = '11111111-1111-4111-8111-111111111111'
    returning 1
  ) select count(*)::int from changed),
  0,
  'a user cannot update another profile'
);

reset role;
select * from extensions.finish();
rollback;

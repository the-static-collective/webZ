select cron.schedule(
 'ic02_prune_expired_invitation_network',
 '17 3 * * *',
 $job$
 delete from public.ic02_threads where expires_at < now();
 delete from public.ic02_quotas where expires_at < now() - interval '1 day';
 delete from public.ic02_reports where created_at < now() - interval '45 days';
 $job$
);

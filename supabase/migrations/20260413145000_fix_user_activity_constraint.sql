-- Add unique constraint to user_activity to allow for upserts on user_id and activity_date
ALTER TABLE public.user_activity 
ADD CONSTRAINT user_id_activity_date_unique UNIQUE (user_id, activity_date);

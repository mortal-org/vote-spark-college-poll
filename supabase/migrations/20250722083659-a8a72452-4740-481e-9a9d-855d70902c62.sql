-- Make email nullable since we're now using reg_no and mobile
ALTER TABLE public.voters 
ALTER COLUMN email DROP NOT NULL;
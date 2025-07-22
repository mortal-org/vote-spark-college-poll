-- Add registration number and mobile columns to voters table
ALTER TABLE public.voters 
ADD COLUMN reg_no TEXT,
ADD COLUMN mobile TEXT;

-- Update the table to make reg_no and mobile required for new entries
-- We'll keep email for now but make it nullable since existing records might have it
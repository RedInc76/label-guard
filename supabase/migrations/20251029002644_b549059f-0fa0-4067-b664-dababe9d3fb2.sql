-- Add nutrition score columns to scan_history table
ALTER TABLE scan_history 
ADD COLUMN nutriscore_grade text,
ADD COLUMN nova_group integer,
ADD COLUMN ecoscore_grade text;
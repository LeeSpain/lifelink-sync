-- Update the Bluetooth pendant price from €59.99 to €4.99
UPDATE public.products 
SET price = 4.99, updated_at = now()
WHERE name ILIKE '%bluetooth%' AND name ILIKE '%pendant%';
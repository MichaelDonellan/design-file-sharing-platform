-- Update all designs to use their store's currency
UPDATE designs d
SET currency = s.currency
FROM stores s
WHERE d.store_id = s.id
AND d.currency IS DISTINCT FROM s.currency;

-- Add a comment to explain the migration
COMMENT ON TABLE designs IS 'Designs table - currency field is now deprecated, store currency is used for Stripe checkout'; 
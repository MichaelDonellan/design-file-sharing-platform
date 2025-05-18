-- Ensure that new stores (inserted from now on) default to GBP if no currency is provided.
ALTER TABLE stores ALTER COLUMN currency DROP NOT NULL;
ALTER TABLE stores ALTER COLUMN currency SET DEFAULT 'gbp';

-- (Optional: update any existing stores (if any) that have NULL currency to 'gbp')
-- UPDATE stores SET currency = 'gbp' WHERE currency IS NULL;

-- Add a comment on the table to document the default currency.
COMMENT ON TABLE stores IS 'Stores table – new stores (inserted from now on) default to GBP.';

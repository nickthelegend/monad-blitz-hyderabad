-- Add detailed trade fields to trade_signals
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS entry_price NUMERIC;
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS exit_price NUMERIC;
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS pnl NUMERIC;
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS fees NUMERIC;
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS side TEXT; -- 'LONG' or 'SHORT'
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE trade_signals ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Backfill side from is_long if needed
UPDATE trade_signals SET side = CASE WHEN is_long THEN 'LONG' ELSE 'SHORT' END WHERE side IS NULL;

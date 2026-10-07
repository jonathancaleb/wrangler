CREATE TABLE callbacks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL,              -- checkout | deposit | payout | refund
  status      TEXT NOT NULL,              -- success | error | cancel | ...
  method      TEXT NOT NULL,
  query       TEXT,                       -- JSON of query params
  body        TEXT,                       -- raw request body
  processed   INTEGER NOT NULL DEFAULT 0, -- set to 1 once your wallet has handled it
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_callbacks_type_status ON callbacks (type, status);
CREATE INDEX idx_callbacks_processed ON callbacks (processed);

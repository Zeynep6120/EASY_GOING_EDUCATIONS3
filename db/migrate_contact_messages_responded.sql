-- Migration: Add is_responded column to contact_messages table
-- This allows ADMIN and MANAGER to mark contact messages as responded

ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS is_responded BOOLEAN DEFAULT FALSE;

-- Create index for filtering responded messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_responded 
ON contact_messages(is_responded);

-- Update existing messages to have is_responded = false
UPDATE contact_messages 
SET is_responded = FALSE 
WHERE is_responded IS NULL;


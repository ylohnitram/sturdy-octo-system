-- Migration: Add trigger to sync journal_entries count with user_stats.body_count
-- Description: Automatically updates body_count when journal entries are added/removed

-- Function to update body count
CREATE OR REPLACE FUNCTION update_body_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate the actual count from journal_entries
    UPDATE user_stats
    SET body_count = (
        SELECT COUNT(*)
        FROM journal_entries
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    )
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_body_count_on_insert ON journal_entries;
DROP TRIGGER IF EXISTS sync_body_count_on_delete ON journal_entries;

-- Trigger on INSERT
CREATE TRIGGER sync_body_count_on_insert
AFTER INSERT ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_body_count();

-- Trigger on DELETE
CREATE TRIGGER sync_body_count_on_delete
AFTER DELETE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_body_count();

-- One-time sync: Update all existing body counts
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM journal_entries
    LOOP
        UPDATE user_stats
        SET body_count = (
            SELECT COUNT(*)
            FROM journal_entries
            WHERE user_id = user_record.user_id
        )
        WHERE user_id = user_record.user_id;
    END LOOP;
END $$;

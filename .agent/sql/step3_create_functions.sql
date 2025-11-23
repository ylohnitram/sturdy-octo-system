-- =====================================================
-- STEP 3: Create RPC functions
-- =====================================================

-- Function: unlock_user_gallery
CREATE OR REPLACE FUNCTION unlock_user_gallery(
    p_viewer_id UUID,
    p_owner_id UUID,
    p_cost INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_viewer_coins INTEGER;
    v_revenue_share INTEGER;
BEGIN
    v_revenue_share := CEIL(p_cost * 0.5);
    
    IF EXISTS (
        SELECT 1 FROM gallery_unlocks 
        WHERE viewer_id = p_viewer_id 
        AND owner_id = p_owner_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    SELECT coins INTO v_viewer_coins
    FROM user_stats
    WHERE user_id = p_viewer_id;
    
    IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
        RETURN FALSE;
    END IF;
    
    UPDATE user_stats
    SET coins = coins - p_cost
    WHERE user_id = p_viewer_id;
    
    UPDATE user_stats
    SET coins = coins + v_revenue_share
    WHERE user_id = p_owner_id;
    
    INSERT INTO gallery_unlocks (viewer_id, owner_id, cost, revenue_share)
    VALUES (p_viewer_id, p_owner_id, p_cost, v_revenue_share)
    ON CONFLICT (viewer_id, owner_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$;

-- Function: check_gallery_unlocked
CREATE OR REPLACE FUNCTION check_gallery_unlocked(
    p_viewer_id UUID,
    p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM gallery_unlocks
        WHERE viewer_id = p_viewer_id
        AND owner_id = p_owner_id
    );
END;
$$;

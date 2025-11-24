-- =====================================================
-- FIX: Unlock User Gallery Logic
-- =====================================================
-- Fixes the bug where unlocking additional permanent photos
-- failed because the system incorrectly treated it as a
-- subscription renewal and skipped the image loop.
-- =====================================================

CREATE OR REPLACE FUNCTION unlock_user_gallery_v2(
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
    v_image RECORD;
    v_image_count INTEGER := 0;
    v_permanent_count INTEGER := 5;
    v_existing_unlock RECORD;
BEGIN
    v_revenue_share := CEIL(p_cost * 0.5);
    
    -- Check coins
    SELECT coins INTO v_viewer_coins
    FROM user_stats
    WHERE user_id = p_viewer_id;
    
    IF v_viewer_coins IS NULL OR v_viewer_coins < p_cost THEN
        RETURN FALSE;
    END IF;
    
    -- Process payment
    UPDATE user_stats SET coins = coins - p_cost WHERE user_id = p_viewer_id;
    UPDATE user_stats SET coins = coins + v_revenue_share WHERE user_id = p_owner_id;
    
    -- ALWAYS iterate through images to ensure all are unlocked/extended correctly
    FOR v_image IN 
        SELECT id FROM gallery_images 
        WHERE user_id = p_owner_id AND is_private = true 
        ORDER BY created_at ASC
    LOOP
        v_image_count := v_image_count + 1;
        
        IF v_image_count <= v_permanent_count THEN
            -- First 5 images = permanent
            -- If already exists (permanent or subscription), ensure it becomes permanent
            INSERT INTO gallery_image_unlocks (viewer_id, image_id, unlock_type, expires_at)
            VALUES (p_viewer_id, v_image.id, 'permanent', NULL)
            ON CONFLICT (viewer_id, image_id) 
            DO UPDATE SET 
                unlock_type = 'permanent',
                expires_at = NULL;
        ELSE
            -- Images 6+ = subscription (30 days)
            -- If exists, extend the subscription
            INSERT INTO gallery_image_unlocks (viewer_id, image_id, unlock_type, expires_at)
            VALUES (p_viewer_id, v_image.id, 'subscription', NOW() + INTERVAL '30 days')
            ON CONFLICT (viewer_id, image_id) 
            DO UPDATE SET 
                unlock_type = 'subscription',
                expires_at = NOW() + INTERVAL '30 days';
        END IF;
    END LOOP;
    
    -- Record/Update base unlock summary
    INSERT INTO gallery_unlocks (viewer_id, owner_id, cost, revenue_share, is_subscription, expires_at)
    VALUES (p_viewer_id, p_owner_id, p_cost, v_revenue_share, v_image_count > v_permanent_count, 
            CASE WHEN v_image_count > v_permanent_count THEN NOW() + INTERVAL '30 days' ELSE NULL END)
    ON CONFLICT (viewer_id, owner_id) DO UPDATE
    SET expires_at = CASE WHEN v_image_count > v_permanent_count THEN NOW() + INTERVAL '30 days' ELSE NULL END,
        is_subscription = v_image_count > v_permanent_count,
        cost = p_cost,
        revenue_share = v_revenue_share;
    
    RETURN TRUE;
END;
$$;

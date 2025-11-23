import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendLike } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';

// Mock Supabase
vi.mock('../../services/supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn()
        }
    }
}));

describe('Match Service - sendLike', () => {
    const mockFromUser = 'user-a';
    const mockToUser = 'user-b';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send a like and return success if no match', async () => {
        // Mock Insert Like (Success)
        const mockInsert = vi.fn().mockResolvedValue({ error: null });

        // Mock Check Mutual (No match)
        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null })
                })
            })
        });

        // Mock Notification Insert
        const mockNotifInsert = vi.fn().mockResolvedValue({ error: null });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'likes') return { insert: mockInsert, select: mockSelect };
            if (table === 'notifications') return { insert: mockNotifInsert };
            return { insert: vi.fn() };
        });

        const result = await sendLike(mockFromUser, mockToUser);

        expect(result).toEqual({ success: true, isMatch: false });
        expect(mockInsert).toHaveBeenCalledWith({ from_user_id: mockFromUser, to_user_id: mockToUser });
        // Should check for mutual like
        expect(mockSelect).toHaveBeenCalled();
        // Should send like notification
        expect(mockNotifInsert).toHaveBeenCalledWith(expect.objectContaining({ type: 'like' }));
    });

    it('should detect a match and notify both users', async () => {
        // Mock Insert Like (Success)
        const mockInsert = vi.fn().mockResolvedValue({ error: null });

        // Mock Check Mutual (Match found!)
        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'existing-like-id' } })
                })
            })
        });

        // Mock Match Insert
        const mockMatchInsert = vi.fn().mockResolvedValue({ error: null });

        // Mock Notification Insert
        const mockNotifInsert = vi.fn().mockResolvedValue({ error: null });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'likes') return { insert: mockInsert, select: mockSelect };
            if (table === 'matches') return { insert: mockMatchInsert };
            if (table === 'notifications') return { insert: mockNotifInsert };
            return { insert: vi.fn() };
        });

        const result = await sendLike(mockFromUser, mockToUser);

        expect(result).toEqual({ success: true, isMatch: true });
        // Should insert match
        expect(mockMatchInsert).toHaveBeenCalledWith({ user1_id: mockFromUser, user2_id: mockToUser });
        // Should send match notifications (array of 2)
        expect(mockNotifInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ type: 'match', user_id: mockFromUser }),
            expect.objectContaining({ type: 'match', user_id: mockToUser })
        ]));
    });

    it('should handle duplicate likes gracefully', async () => {
        // Mock Insert Like (Duplicate Error)
        const mockInsert = vi.fn().mockResolvedValue({ error: { code: '23505' } });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'likes') return { insert: mockInsert };
            return { insert: vi.fn() };
        });

        const result = await sendLike(mockFromUser, mockToUser);

        expect(result).toEqual({ success: false, isMatch: false });
    });
});

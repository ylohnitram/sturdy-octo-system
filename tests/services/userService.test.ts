import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUnreadNotificationsCount } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';

vi.mock('../../services/supabaseClient');

describe('userService - getUnreadNotificationsCount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns count of unread notifications', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({
                        count: 5,
                        error: null,
                    }),
                }),
            }),
        } as any);

        const count = await getUnreadNotificationsCount('user-123');
        expect(count).toBe(5);
    });

    it('returns 0 when there are no unread notifications', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({
                        count: 0,
                        error: null,
                    }),
                }),
            }),
        } as any);

        const count = await getUnreadNotificationsCount('user-123');
        expect(count).toBe(0);
    });

    it('returns 0 on error', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({
                        count: null,
                        error: { message: 'Database error' },
                    }),
                }),
            }),
        } as any);

        const count = await getUnreadNotificationsCount('user-123');
        expect(count).toBe(0);
    });

    it('returns 0 when count is null', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({
                        count: null,
                        error: null,
                    }),
                }),
            }),
        } as any);

        const count = await getUnreadNotificationsCount('user-123');
        expect(count).toBe(0);
    });
});

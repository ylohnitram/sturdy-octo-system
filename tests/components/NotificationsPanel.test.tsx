import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsPanel } from '../../components/NotificationsPanel';
import { supabase } from '../../services/supabaseClient';

describe('NotificationsPanel Component', () => {
    const mockUserId = 'test-user-123';
    const mockOnClose = vi.fn();
    const mockOnNotificationCountChange = vi.fn();

    const mockNotifications = [
        {
            id: '1',
            type: 'like',
            content: 'Někdo ti dal srdíčko!',
            created_at: new Date().toISOString(),
            read_at: null,
        },
        {
            id: '2',
            type: 'proximity',
            content: 'V okolí se objevila kořist!',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            read_at: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Supabase responses
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                            data: mockNotifications,
                            error: null,
                        }),
                    }),
                }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
                in: vi.fn().mockResolvedValue({ error: null }),
            }),
        } as any);
    });

    it('renders notification panel with title', () => {
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        expect(screen.getByText('Notifikace')).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        expect(screen.getByText('Načítání...')).toBeInTheDocument();
    });

    it('loads and displays notifications', async () => {
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Někdo ti dal srdíčko!')).toBeInTheDocument();
            expect(screen.getByText('V okolí se objevila kořist!')).toBeInTheDocument();
        });
    });

    it('calls onNotificationCountChange with unread count on load', async () => {
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        await waitFor(() => {
            expect(mockOnNotificationCountChange).toHaveBeenCalledWith(1);
        });
    });

    it('shows "Označit vše" button when there are unread notifications', async () => {
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Označit vše')).toBeInTheDocument();
        });
    });

    it('closes panel when X button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        const closeButton = screen.getAllByRole('button').find(btn =>
            btn.querySelector('svg')
        );

        if (closeButton) {
            await user.click(closeButton);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        }
    });

    it('displays empty state when no notifications', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            }),
        } as any);

        render(
            <NotificationsPanel
                userId={mockUserId}
                onClose={mockOnClose}
                onNotificationCountChange={mockOnNotificationCountChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Žádné notifikace')).toBeInTheDocument();
        });
    });
});

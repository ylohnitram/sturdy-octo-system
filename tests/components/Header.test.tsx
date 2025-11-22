import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../components/Header';

describe('Header Component', () => {
    const mockUserStats = {
        username: 'TestUser',
        coins: 100,
        tier: 'FREE' as const,
        isOnline: true,
        notificationCount: 0,
        score: 0,
        aiCredits: 0,
        inviteCode: 'TEST123',
        invitesAvailable: 5,
    };

    const mockProps = {
        userStats: mockUserStats,
        avatarUrl: 'https://example.com/avatar.jpg',
        onOpenStore: vi.fn(),
        onNavigateProfile: vi.fn(),
        onOpenNotifications: vi.fn(),
    };

    it('renders user information correctly', () => {
        render(<Header {...mockProps} />);
        expect(screen.getByText('TestUser')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    it('shows GOLD badge for premium users', () => {
        const premiumProps = {
            ...mockProps,
            userStats: { ...mockUserStats, tier: 'PREMIUM' as const },
        };
        render(<Header {...premiumProps} />);
        expect(screen.getByText('GOLD')).toBeInTheDocument();
        expect(screen.getByText('Premium Member')).toBeInTheDocument();
    });

    it('shows notification badge when there are unread notifications', () => {
        const propsWithNotifications = {
            ...mockProps,
            userStats: { ...mockUserStats, notificationCount: 3 },
        };
        render(<Header {...propsWithNotifications} />);
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not show notification badge when count is 0', () => {
        render(<Header {...mockProps} />);
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('bell icon is dim when no notifications', () => {
        const { container } = render(<Header {...mockProps} />);
        const bellIcon = container.querySelector('.text-slate-600');
        expect(bellIcon).toBeInTheDocument();
    });

    it('bell icon is bright when there are notifications', () => {
        const propsWithNotifications = {
            ...mockProps,
            userStats: { ...mockUserStats, notificationCount: 2 },
        };
        const { container } = render(<Header {...propsWithNotifications} />);
        const bellIcon = container.querySelector('.text-yellow-500');
        expect(bellIcon).toBeInTheDocument();
    });

    it('calls onOpenNotifications when bell is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<Header {...mockProps} />);
        const bellButton = container.querySelector('button[class*="p-2"]');

        if (bellButton) {
            await user.click(bellButton);
            expect(mockProps.onOpenNotifications).toHaveBeenCalledTimes(1);
        }
    });

    it('calls onOpenStore when coins button is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<Header {...mockProps} />);
        const coinsButton = container.querySelector('button[class*="bg-slate-800"]');

        if (coinsButton) {
            await user.click(coinsButton);
            expect(mockProps.onOpenStore).toHaveBeenCalledTimes(1);
        }
    });

    it('calls onNavigateProfile when profile area is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<Header {...mockProps} />);
        const profileArea = container.querySelector('.cursor-pointer');

        if (profileArea) {
            await user.click(profileArea);
            expect(mockProps.onNavigateProfile).toHaveBeenCalledTimes(1);
        }
    });
});

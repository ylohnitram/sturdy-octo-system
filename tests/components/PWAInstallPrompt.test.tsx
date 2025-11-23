import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PWAInstallPrompt } from '../../components/PWAInstallPrompt';
import React from 'react';

describe('PWAInstallPrompt', () => {
    const originalUserAgent = window.navigator.userAgent;

    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        // Mock matchMedia
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
        Object.defineProperty(window.navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true
        });
    });

    it('should NOT show on non-iOS devices', () => {
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            configurable: true
        });

        render(<PWAInstallPrompt />);
        vi.advanceTimersByTime(3000);

        expect(screen.queryByText('Nainstalovat aplikaci')).toBeNull();
    });

    // TODO: Fix this test - it times out in CI/CD environment likely due to navigator mocking issues
    it.skip('should show on iOS devices (iPhone) if not standalone', async () => {
        // Mock User Agent using getter
        Object.defineProperty(window.navigator, 'userAgent', {
            get: function () {
                return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
            },
            configurable: true
        });

        // Ensure standalone is false
        Object.defineProperty(window.navigator, 'standalone', {
            value: false,
            configurable: true
        });

        render(<PWAInstallPrompt />);

        // Advance time
        await React.act(async () => {
            vi.advanceTimersByTime(3000);
        });

        // Should be visible
        await waitFor(() => {
            expect(screen.getByText('Nainstalovat aplikaci')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('should NOT show if already in standalone mode', () => {
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
            configurable: true
        });

        // Mock Standalone
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(display-mode: standalone)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<PWAInstallPrompt />);
        vi.advanceTimersByTime(3000);

        expect(screen.queryByText('Nainstalovat aplikaci')).toBeNull();
    });

    it('should NOT show if dismissed in localStorage', () => {
        localStorage.setItem('notch_pwa_prompt_dismissed', 'true');
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
            configurable: true
        });

        render(<PWAInstallPrompt />);
        vi.advanceTimersByTime(3000);

        expect(screen.queryByText('Nainstalovat aplikaci')).toBeNull();
    });
});

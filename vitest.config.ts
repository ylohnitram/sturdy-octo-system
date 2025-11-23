import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.ts',
        pool: 'threads',
        maxWorkers: 1,
        poolOptions: {
            threads: {
                timeout: 120000, // allow slow jsdom startup in WSL/CI
            },
        },
        testTimeout: 20000,
        hookTimeout: 20000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '*.config.ts',
                'dist/',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});

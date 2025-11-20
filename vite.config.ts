import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Debug: Log what we're about to inject
  console.log('🔍 Vite Config - Injecting env vars:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET (' + process.env.VITE_SUPABASE_URL.substring(0, 30) + '...)' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.VITE_SUPABASE_ANON_KEY.length + ')' : 'MISSING'
  });

  console.log('🔍 Vite loadEnv result:', {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'SET (' + env.VITE_SUPABASE_URL.substring(0, 30) + '...)' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'SET (length: ' + env.VITE_SUPABASE_ANON_KEY.length + ')' : 'MISSING'
  });
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

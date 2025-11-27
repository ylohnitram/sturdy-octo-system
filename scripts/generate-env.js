#!/usr/bin/env node

// This script creates .env.production from Vercel environment variables
import { writeFileSync } from 'fs';

const envContent = `VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
GEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}
`;

writeFileSync('.env.production', envContent);
console.log('✅ Generated .env.production from Vercel environment variables');

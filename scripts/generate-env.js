#!/usr/bin/env node

// This script creates .env.production from Vercel environment variables
const fs = require('fs');

const envContent = `VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
`;

fs.writeFileSync('.env.production', envContent);
console.log('✅ Created .env.production with Vercel env vars');

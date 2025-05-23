// Simple script to run the resetDesigns.ts with the environment variables
const { spawn } = require('child_process');
const path = require('path');

// Extract credentials from .env.example
const fs = require('fs');
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const supabaseUrl = envExample.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseKey = envExample.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

// Run the script with environment variables
const env = {
  ...process.env,
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseKey
};

console.log('Running resetDesigns.ts with Supabase credentials...');
const resetProcess = spawn('npx', ['tsx', 'scripts/resetDesigns.ts'], { 
  env,
  stdio: 'inherit',
  shell: true
});

resetProcess.on('close', (code) => {
  console.log(`Reset process exited with code ${code}`);
});

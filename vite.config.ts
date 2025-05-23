import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    optimizeDeps: {
      include: [
        'lucide-react',
        'axios',
        '@supabase/supabase-js',
        'date-fns',
        'react-hot-toast',
        'react-toastify',
        'react-router-dom',
        'swiper',
        '@headlessui/react',
        // Dynamic imports that need optimization
        'jszip',
        // Ensure sub-imports are also included
        'react-router-dom/client',
        'react-router-dom/server',
        'react-router-dom/dist/index'
      ]
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true,
      open: true
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      open: true
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    build: {
      rollupOptions: {
        external: [] // No missing dependency, list is now empty
      }
    }
  };
});
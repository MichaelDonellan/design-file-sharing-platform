# Design File Sharing Platform

A modern web application for sharing and discovering design resources. Built with React, TypeScript, and Supabase.

## Features

- User authentication and authorization
- Design file upload and management
- Search and filtering capabilities
- Tags and categories for better organization
- Responsive design for all devices
- Secure file storage and sharing

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Authentication, Database, Storage)
- React Router
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd [project-directory]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

## Deployment

The project is configured for deployment on Netlify. The `netlify.toml` file includes all necessary configuration for:
- Build settings
- MIME type headers
- Security headers
- SPA routing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
# Deployment Guide

## Server Configuration

This admin dashboard is now configured to work with the server at `https://amris.duckdns.org`.

### Environment Variables

You can optionally set these environment variables to customize the API endpoints:

```bash
# Main API base URL (defaults to https://amris.duckdns.org/api)
NEXT_PUBLIC_API_BASE_URL=https://amris.duckdns.org/api

# Alternative API URL for specific components (defaults to https://amris.duckdns.org/api)
NEXT_PUBLIC_API_URL=https://amris.duckdns.org/api

# API domain for display purposes (defaults to amris.duckdns.org)
NEXT_PUBLIC_API_DOMAIN=amris.duckdns.org
```

### For Local Development

If you need to run this locally with a different backend, you can set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_DOMAIN=localhost:8000
```

### Build and Deploy

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

### Docker Deployment

If using Docker, the application is configured with `output: "standalone"` in `next.config.js` for optimal containerization.

### CORS Configuration

The `next.config.js` file includes the necessary CORS settings for:
- `localhost:3000` (local development)
- `192.168.1.3:3000` (local network)
- `amris.duckdns.org:3000` (production server)

### Image Loading

The application is configured to load images from:
- `https://amris.duckdns.org/media/**` (primary)
- `http://192.168.1.3:8000/media/**` (fallback)
- `https://t3h.dracode.org/media/**` (legacy fallback)
- `http://localhost:8000/media/**` (development)
- `http://127.0.0.1:8000/media/**` (development)

## Changes Made

The following files were updated to use the new server IP:

1. **`app/lib/api.ts`** - Main API configuration
2. **`app/(dashboard)/videos/advertisement/page.tsx`** - Video management API
3. **`app/components/layout/header.tsx`** - Connection status display
4. **`next.config.js`** - Image loading and CORS configuration
5. **`README.md`** - Documentation updates

All API calls will now use `https://amris.duckdns.org/api` by default. 
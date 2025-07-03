/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  /* config options here */
  output: "standalone",
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.1.3',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 't3h.dracode.org',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      }
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@/app/components": path.resolve(__dirname, "./app/components"),
      "@/app/lib": path.resolve(__dirname, "./app/lib"),
    };
    return config;
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;

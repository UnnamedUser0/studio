/** @type {import('next').NextConfig} */
require('events').EventEmitter.defaultMaxListeners = 20;

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    // This is to allow the Next.js dev server to be accessed from the
    // preview URL of the remote development environment.
  },
  webpack: (config) => {
    config.externals.push({
      "bufferutil": "bufferutil",
      "utf-8-validate": "utf-8-validate"
    });
    return config;
  },
  allowedDevOrigins: [
    'https://*.cluster-thle3dudhffpwss7zs5hxaeu2o.cloudworkstations.dev',
    'http://192.168.1.8:3000',
    'http://192.168.1.8:3002',
  ],
};

module.exports = nextConfig;

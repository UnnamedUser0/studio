import type {NextConfig} from 'next';
const nextConfig: NextConfig = {
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
  ],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // By providing a static build ID, we prevent mismatches between client and server assets
  // after a new deployment, which resolves the "Server Action was not found" error.
  generateBuildId: async () => {
    return 'vanvertapp-stable-build-id';
  },
  typescript: {
    ignoreBuildErrors: true,
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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: ['@genkit-ai/core', '@genkit-ai/googleai', 'genkit'],
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
};

module.exports = nextConfig;

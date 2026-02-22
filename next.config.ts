
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
      allowedOrigins: [
        "https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app",
        "https://REDACTED_FIREBASE_PROJECT_ID.web.app",
        "https://REDACTED_FIREBASE_AUTH_DOMAIN",
        "https://3000-firebase-pilotpack-pre-1769026686788.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev"
      ],
    },
  },
};

export default nextConfig;

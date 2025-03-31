/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output static files when using `next export`
  // Uncomment this if you plan to use `next export`
  // output: 'export',
  
  // Add image domains if needed
  images: {
    domains: [],
    unoptimized: true,
  },
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;


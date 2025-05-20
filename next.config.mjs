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
  
  // Disable ESLint during builds for performance
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during builds for performance
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  swcMinify: true, // Use SWC minifier instead of Terser for faster builds
  
  // Experimental features for better performance
  experimental: {
    // Enable optimizations
    optimizeCss: true, // Optimize CSS
    webpackBuildWorker: true, // Use workers for webpack build
    serverActions: {
      bodySizeLimit: '2mb', // Increase limit for server actions
    },
    // Parallel builds for faster compilation
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Memory optimizations
    memoryBasedWorkersCount: true,
  },
  
  // Configure webpack for better performance
  webpack: (config, { isServer }) => {
    // Optimize packages
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add any specific aliases here if needed
    };
    
    return config;
  },
};

export default nextConfig;

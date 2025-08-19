import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Monaco Editor webpack configuration
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
  // Suppress hydration warnings for Monaco Editor
  reactStrictMode: true,
  // Enable experimental features if needed
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@monaco-editor/react'],
  },
};

export default nextConfig;

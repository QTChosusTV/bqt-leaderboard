import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@appletosolutions/reactbits"],
  webpack: (config) => {
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

import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config: Configuration, context: { isServer: boolean }) => {
    const { isServer } = context;

    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          canvas: false,
          'rdf-canonize-native': false,
        },
      };
    }

    if (!Array.isArray(config.externals)) {
      config.externals = config.externals ? [config.externals] : [];
    }

    config.externals.push({
      'rdf-canonize-native': 'commonjs rdf-canonize-native',
    });

    return config;
  },
};

export default nextConfig;

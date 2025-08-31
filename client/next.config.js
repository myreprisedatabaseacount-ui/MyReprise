const createNextIntlPlugin = require('next-intl/plugin');

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // empêche webpack de chercher fs côté client
      }
    }
    return config
  },
}

const withNextIntl = createNextIntlPlugin();

module.exports = withNextIntl(nextConfig);

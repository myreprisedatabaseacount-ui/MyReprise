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
  }
  // images: {
  //   loader: 'custom',
  //   loaderFile: './src/utils/cloudenary-loader.ts',
  // }
}



const withNextIntl = createNextIntlPlugin();

module.exports = withNextIntl(nextConfig);

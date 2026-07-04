/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow outbound requests to target domains during scanning
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

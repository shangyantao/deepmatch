/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains 已废弃，完全改用 remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',  // 匹配所有 vercel.app 子域名
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.trycloudflare.com',  // 匹配 cloudflare 临时域名
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
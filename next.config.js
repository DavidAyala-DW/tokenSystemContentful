/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    layoutRaw: true,
    domains: [
      "cdn.bitskistatic.com",
      "www.bitski.com"
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-8a72d0656f234f4f8b057562db9d565a.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;

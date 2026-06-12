/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Allow the channel service (separate origin) to call our receipt API in dev.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};
export default nextConfig;

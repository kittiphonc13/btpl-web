/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co http://localhost:8000; img-src 'self' data: blob:; font-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self';"
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;

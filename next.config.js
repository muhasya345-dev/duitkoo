/** @type {import('next').NextConfig} */
const nextConfig = {
  // WAJIB: static export agar bisa deploy ke Cloudflare Pages tanpa SSR.
  output: 'export',
  // next/image optimizer Vercel tidak tersedia di static export.
  images: { unoptimized: true },
  // URL bersih tanpa trailing slash inconsistency saat di-host di Pages.
  trailingSlash: false,
  reactStrictMode: true,
}

module.exports = nextConfig

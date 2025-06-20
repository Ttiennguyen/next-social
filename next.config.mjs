/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: true,  // Bật compiler React mới (nâng hiệu suất)
    ppr: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:"images.pexels.com"  // Cho phép tải ảnh từ Pexels
      },
      {
        protocol: 'https',
        hostname:"img.clerk.com"   // Cho phép tải ảnh từ Clerk
      },
      {
        protocol: 'https',
        hostname:"res.cloudinary.com"  // Cho phép tải ảnh từ Cloudinary
      }
    ]
  },
};

export default nextConfig;

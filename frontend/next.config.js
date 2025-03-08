/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // 배포 환경에서는 프록시 경로를 사용하지 않음
  basePath: '',
  assetPrefix: '',
  
  // ESLint 오류 비활성화
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // API 요청을 프록시하여 CORS 문제 해결
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // CORS 이슈 해결을 위한 헤더 추가
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 
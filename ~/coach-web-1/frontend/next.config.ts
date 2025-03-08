import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 엘리스 프록시 환경에서 실행될 때 base path 설정
  basePath: process.env.NODE_ENV === 'production' ? '/proxy/3000' : '',
  // 정적 자산의 경로 지정
  assetPrefix: process.env.NODE_ENV === 'production' ? '/proxy/3000' : '',
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
  // CORS 이슈 해결을 위한 헤더 추가
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie' },
        ],
      },
    ];
  },
};

export default nextConfig; 
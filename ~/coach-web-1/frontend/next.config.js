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
  
  // Nginx가 API 리다이렉션을 처리하므로 설정 제거
  
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

module.exports = nextConfig; 
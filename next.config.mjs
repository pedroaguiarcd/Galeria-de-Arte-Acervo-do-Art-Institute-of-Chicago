/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 é um módulo nativo: não deve ser empacotado pelo bundler.
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Links curtos pra bio das redes. O "/" lê os utm_* (components/site/Rastreio.tsx)
  // e o botão de WhatsApp manda "(ref: instagram/bio)" — o CRM marca a origem.
  async redirects() {
    const bio = (rede) => ({
      source: `/${rede}`,
      destination: `/?utm_source=${rede}&utm_medium=social&utm_campaign=bio`,
      permanent: false,
    });
    return [bio("instagram"), bio("facebook"), bio("tiktok")];
  },
  webpack: (config, { webpack }) => {
    // web-ifc e libredwg-web referenciam módulos node inexistentes no browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      perf_hooks: false,
      worker_threads: false,
      crypto: false,
      module: false,
    };
    // o glue do libredwg-web importa "node:module" — remove o prefixo node:
    // pra cair no fallback acima em vez de quebrar o build.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
    return config;
  },
};

module.exports = nextConfig;

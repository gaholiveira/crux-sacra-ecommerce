import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // CSP fica de fora por enquanto: o Brick da Mercado Pago carrega
  // script/iframe de domínios deles que não dá pra confirmar sem testar o
  // checkout de verdade num navegador — uma CSP errada quebraria o
  // pagamento sem dar erro de build. Os headers abaixo não têm esse risco.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Só é enviado sobre HTTPS, e o site já é HTTPS-only na Vercel —
          // isso só impede downgrade pra HTTP em requisições futuras.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Nenhuma página precisa ser embutida em iframe de outro site.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Impede o navegador de "adivinhar" o tipo de um arquivo servido
          // com Content-Type errado (vetor clássico de XSS via upload).
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Desliga APIs de navegador que o site não usa.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

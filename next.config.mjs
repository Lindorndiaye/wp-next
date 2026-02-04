import mdx from "@next/mdx";

const withMDX = mdx({
  extension: /\.mdx?$/,
  options: {},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  transpilePackages: ["next-mdx-remote"],
  async rewrites() {
    return [
      {
        source: "/a-propos",
        destination: "/about",
      },
      {
        source: "/galerie",
        destination: "/gallery",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "api.wintech.sn",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "**",
      },
      // Support pour tous les domaines WordPress (peut être configuré via variable d'environnement)
      ...(process.env.WORDPRESS_URL
        ? (() => {
            try {
              // Ajouter le protocole si absent
              let wpUrl = process.env.WORDPRESS_URL;
              if (!wpUrl.startsWith("http://") && !wpUrl.startsWith("https://")) {
                wpUrl = `https://${wpUrl}`;
              }
              const url = new URL(wpUrl);
              return [
                {
                  protocol: url.protocol.replace(":", ""),
                  hostname: url.hostname,
                  pathname: "**",
                },
              ];
            } catch (e) {
              console.warn("Invalid WORDPRESS_URL:", process.env.WORDPRESS_URL);
              return [];
            }
          })()
        : []),
    ],
  },
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default withMDX(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Racine explicite : sinon Next remonte jusqu'à un package-lock.json orphelin
  // dans le dossier personnel et scanne tout le home (build et dev très lents).
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

module.exports = nextConfig;

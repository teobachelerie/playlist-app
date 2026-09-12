import "./globals.css";

export const metadata = {
  title: "Playlist",
  description: "Lecteur de playlist perso",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Playlist",
  },
};

export const viewport = {
  themeColor: "#141311",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-base text-text font-sans">{children}</body>
    </html>
  );
}

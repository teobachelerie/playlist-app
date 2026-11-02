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
  themeColor: "#E9E6E2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("expenses-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#161412");}}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-base text-text font-sans">{children}</body>
    </html>
  );
}

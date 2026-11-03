import "./globals.css";

export const metadata = {
  title: "Playlist",
  description: "Lecteur de playlist perso",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Playlist",
  },
};

export const viewport = {
  themeColor: "#E9E6E2",
  // L'app dessine aussi sous la barre d'état et la barre d'accueil (le fond
  // remplit tout l'écran) ; les marges sûres sont gérées par les composants.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;function h(){var v=innerHeight,p=document.createElement("div");p.style.cssText="position:fixed;top:0;height:0;padding-top:env(safe-area-inset-top);visibility:hidden";(document.body||d).appendChild(p);var t=p.offsetHeight;p.remove();var f=innerWidth<innerHeight?screen.height:screen.width;var app=navigator.standalone||matchMedia("(display-mode: standalone)").matches;if(f>v&&(app||(t>0&&Math.abs(f-v-t)<=2)))v=f;d.style.setProperty("--app-h",v+"px");}h();addEventListener("DOMContentLoaded",h);addEventListener("resize",h);addEventListener("orientationchange",function(){setTimeout(h,300)});})();try{if(!sessionStorage.getItem("intro")){sessionStorage.setItem("intro","1");document.documentElement.setAttribute("data-intro","");}}catch(e){}try{var t=localStorage.getItem("expenses-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#161412");}}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-base text-text font-sans">{children}</body>
    </html>
  );
}

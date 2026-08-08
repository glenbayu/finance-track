import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import IdleSessionGuard from "@/components/auth/idle-session-guard";
import PwaRegistration from "@/components/pwa/pwa-registration";
import ThemeProvider from "@/components/ui/theme-provider";
import ToastQueryListener from "@/components/ui/toast-query-listener";
import { Suspense } from "react";

export const metadata: Metadata = {
  applicationName: "Finance Tracker",
  title: "Finance Tracker",
  description:
    "Personal finance tracker for monitoring income, expenses, budgets, and analytics.",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance Tracker",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#131313" },
  ],
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = window.localStorage.getItem("theme");
                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                    document.documentElement.style.colorScheme = "dark";
                  } else {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.style.colorScheme = "light";
                  }
                  
                  var ua = navigator.userAgent || "";
                  if (/android/i.test(ua)) {
                    document.documentElement.classList.add("is-android");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <IdleSessionGuard />
          <PwaRegistration />
          <Suspense>
            <ToastQueryListener />
          </Suspense>
          {children}
          <Toaster position="bottom-center" toastOptions={{ style: { background: 'var(--lk-surface)', color: 'var(--lk-text)', border: '1px solid var(--lk-border)' } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}

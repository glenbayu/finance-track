import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
import IdleSessionGuard from "@/components/auth/idle-session-guard";
import PwaRegistration from "@/components/pwa/pwa-registration";
import ToastQueryListener from "@/components/ui/toast-query-listener";
import { Suspense } from "react";

export const metadata: Metadata = {
  applicationName: "Finance Journal",
  title: "Finance Journal",
  description:
    "Personal finance tracker for monitoring income, expenses, budgets, and analytics.",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance Journal",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
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
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <IdleSessionGuard />
        <PwaRegistration />
        <Suspense>
          <ToastQueryListener />
        </Suspense>
        {children}
        <Toaster position="bottom-center" offset={24} mobileOffset={{ bottom: 96, left: 16, right: 16 }} toastOptions={{ style: { background: 'var(--lk-surface)', color: 'var(--lk-text)', border: '1px solid var(--lk-border)' } }} />
      </body>
    </html>
  );
}

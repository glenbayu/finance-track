"use client";

import { useEffect, useState } from "react";
import { Download, LoaderCircle, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function isAndroidDevice() {
  return /Android/i.test(window.navigator.userAgent);
}

export default function PwaInstallCard() {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateInstalledState = () => {
      setIsInstalled(isStandaloneMode());
    };

    setIsAndroid(isAndroidDevice());
    updateInstalledState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!isAndroid || isInstalled) {
    return null;
  }

  const canPromptInstall = installPromptEvent !== null;

  const handleInstall = async () => {
    if (!installPromptEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } finally {
      setIsInstalling(false);
      setInstallPromptEvent(null);
    }
  };

  return (
    <article className="section-card lg:hidden">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <Smartphone size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Install App</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pasang Finance Tracker ke layar utama Android biar aksesnya lebih cepat.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="soft-inset space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Tambahkan ke Home Screen
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tampilan akan terasa seperti aplikasi native saat dibuka dari layar utama.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/30 dark:text-emerald-300">
              Android
            </span>
          </div>

          {canPromptInstall ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={isInstalling}
              className="btn-primary inline-flex w-full items-center justify-center gap-2"
            >
              {isInstalling ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
              {isInstalling ? "Menyiapkan instalasi..." : "Install PWA"}
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--stroke)] bg-[color:var(--surface)]/70 px-4 py-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
              Kalau tombol install belum muncul, buka menu browser Chrome lalu pilih
              {" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Add to Home screen
              </span>
              {" "}
              atau
              {" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Install app
              </span>
              .
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

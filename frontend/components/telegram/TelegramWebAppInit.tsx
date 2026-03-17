'use client';

import { useEffect } from 'react';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      ready?: () => void;
      expand?: () => void;
      disableVerticalSwipes?: () => void;
    };
  };
};

export default function TelegramWebAppInit() {
  useEffect(() => {
    const tgWindow = window as TelegramWindow;
    const webApp = tgWindow.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready?.();
    webApp.expand?.();
    webApp.disableVerticalSwipes?.();
  }, []);

  return null;
}

'use client';

import { useEffect, useRef, useState } from 'react';

export default function QrScanner() {
  const [decoded, setDecoded] = useState<string>('');
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('nm-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text: string) => {
            setDecoded(text);
            scanner.stop().catch(() => null);
          },
          () => null
        );
      } catch (e) {
        setError('Не удалось запустить камеру. Разрешите доступ к камере в браузере.');
      }
    }

    setup();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => null);
      }
    };
  }, []);

  return (
    <section className="nm-card rounded-2xl p-5">
      <h3 className="text-xl font-bold text-gold-400">QR Scanner</h3>
      <div id="nm-qr-reader" className="mt-4 min-h-60 overflow-hidden rounded border border-gold-500/30" />
      {decoded ? <p className="mt-3 text-sm text-emerald-300">Сканировано: {decoded}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}

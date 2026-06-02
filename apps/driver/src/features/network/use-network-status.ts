import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

export type NetworkStatus = {
  isOnline: boolean | null;
  label: string;
};

function labelFromOnline(isOnline: boolean | null) {
  if (isOnline === true) return 'Conectado';
  if (isOnline === false) return 'Sin conexión';
  return 'Verificando red';
}

export function useNetworkStatus(pollMs = 5000): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      const state = await Network.getNetworkStateAsync().catch(() => null);
      if (!mounted) return;
      setIsOnline(state?.isConnected ?? null);
      timeout = setTimeout(poll, pollMs);
    }

    void poll();

    return () => {
      mounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [pollMs]);

  return {
    isOnline,
    label: labelFromOnline(isOnline),
  };
}

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  nickname?: string | null;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  useEffect(() => {
    authClient.getSession().then((result) => {
      setState({
        user: (result?.data?.user as unknown as SessionUser) ?? null,
        loading: false,
      });
    }).catch(() => {
      setState({ user: null, loading: false });
    });
  }, []);

  return state;
}

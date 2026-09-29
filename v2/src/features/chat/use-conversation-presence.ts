import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

type PresenceMeta = { typing?: boolean };

const TYPING_TIMEOUT = 3500;

/**
 * Realtime Presence on the private "conv:{match_id}" channel (authorized by RLS on
 * realtime.messages): who is in the conversation and who is typing.
 */
export function useConversationPresence(matchId: string, myId: string | undefined) {
  const [otherHere, setOtherHere] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);
  const typing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!myId) return;
    const ch = supabase.channel(`conv:${matchId}`, {
      config: { private: true, presence: { key: myId } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      const others = Object.entries(ch.presenceState<PresenceMeta>()).filter(
        ([key]) => key !== myId,
      );
      setOtherHere(others.length > 0);
      setOtherTyping(others.some(([, metas]) => metas.some((m) => m.typing)));
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') void ch.track({ typing: false });
    });
    channel.current = ch;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      channel.current = null;
      typing.current = false;
      void supabase.removeChannel(ch);
    };
  }, [matchId, myId]);

  /** Call on every keystroke (`true`) and after sending (`false`). */
  const setTyping = useCallback((value: boolean) => {
    const publish = (next: boolean) => {
      if (typing.current === next) return;
      typing.current = next;
      void channel.current?.track({ typing: next });
    };
    if (timer.current) clearTimeout(timer.current);
    if (value) timer.current = setTimeout(() => publish(false), TYPING_TIMEOUT);
    publish(value);
  }, []);

  return { otherHere, otherTyping, setTyping };
}

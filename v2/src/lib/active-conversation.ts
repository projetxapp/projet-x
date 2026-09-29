/** Which conversation is on screen (to skip toasts / unread bumps for it). */
let current: string | null = null;

export const activeConversation = {
  get: (): string | null => current,
  set: (matchId: string | null): void => {
    current = matchId;
  },
};

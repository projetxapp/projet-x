import { compressImage, uploadPublicImage, type PickedImage } from '@/lib/images';
import { kv } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

/**
 * Signup credentials kept IN MEMORY ONLY between the signup form and the "J'ai confirmé"
 * button of the verify screen (never written to disk).
 */
let pendingCredentials: { email: string; password: string } | null = null;

export const pendingSignup = {
  set: (email: string, password: string) => {
    pendingCredentials = { email, password };
  },
  get: () => pendingCredentials,
  clear: () => {
    pendingCredentials = null;
  },
};

const AVATAR_KEY = 'px-pending-avatar';

/**
 * The profile photo chosen during signup can only be uploaded once the email is confirmed
 * (storage policies need a session). We keep the compressed image locally until then.
 */
export const pendingAvatar = {
  set: (image: PickedImage) => kv.setItem(AVATAR_KEY, JSON.stringify(image)),
  clear: () => kv.removeItem(AVATAR_KEY),
  async uploadIfAny(userId: string): Promise<void> {
    const raw = kv.getItem(AVATAR_KEY);
    if (!raw) return;
    try {
      const image = JSON.parse(raw) as PickedImage;
      const url = await uploadPublicImage(
        'avatars',
        userId,
        await compressImage(image, 720),
        'avatar',
      );
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);
      if (error) throw error;
    } finally {
      kv.removeItem(AVATAR_KEY);
    }
  },
};

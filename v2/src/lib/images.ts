import * as Crypto from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { env } from './env';
import { supabase } from './supabase';

export type PickedImage = { uri: string; width: number; height: number };

export class PermissionDeniedError extends Error {
  constructor() {
    super("Autorise l'accès à tes photos dans les réglages pour continuer.");
  }
}

export async function pickImage(
  options: { aspect?: [number, number]; camera?: boolean } = {},
): Promise<PickedImage | null> {
  if (Platform.OS !== 'web') {
    const permission = options.camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new PermissionDeniedError();
  }
  const launch = options.camera
    ? ImagePicker.launchCameraAsync
    : ImagePicker.launchImageLibraryAsync;
  const result = await launch({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: options.aspect ?? [1, 1],
    quality: 1,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, width: asset.width, height: asset.height } : null;
}

/** Resizes to `maxSide` (default 1080 px) and re-encodes as WebP. */
export async function compressImage(image: PickedImage, maxSide = 1080): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(image.uri);
  if (Math.max(image.width, image.height) > maxSide) {
    context.resize(image.width >= image.height ? { width: maxSide } : { height: maxSide });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.WEBP, compress: 0.8 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

async function readBytes(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

/** Uploads to a public bucket under `{userId}/…` and returns a cache-busted public URL. */
export async function uploadPublicImage(
  bucket: 'avatars' | 'project-covers',
  userId: string,
  image: PickedImage,
  name: string,
): Promise<string> {
  const path = `${userId}/${name}.webp`;
  const { error } = await supabase.storage.from(bucket).upload(path, await readBytes(image.uri), {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export type Attachment = { uri: string; name: string; mimeType: string; size: number };

/** Uploads a chat attachment to chat-attachments/{userId}/{matchId}/… and returns its path. */
export async function uploadAttachment(
  userId: string,
  matchId: string,
  file: Attachment,
): Promise<string> {
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase().slice(0, 8)
    : 'bin';
  const path = `${userId}/${matchId}/${Crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, await readBytes(file.uri), {
      contentType: file.mimeType,
      upsert: false,
    });
  if (error) throw error;
  return path;
}

/**
 * Optional Supabase image transformations (Pro plan only). On the Free plan the original
 * (already compressed) image is served and expo-image caches it on disk.
 */
export function imageUrl(url: string | null | undefined, width?: number): string | undefined {
  if (!url) return undefined;
  if (!env.imageTransforms || !width || !url.includes('/storage/v1/object/public/')) return url;
  const [base, query] = url.split('?');
  const transformed = base!.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );
  const params = new URLSearchParams(query);
  params.set('width', String(Math.round(width * 2)));
  params.set('quality', '75');
  return `${transformed}?${params.toString()}`;
}

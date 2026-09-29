import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Saves a JSON file and opens the share sheet (RGPD export). */
export async function shareJson(filename: string, data: unknown): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exporter mes données',
    UTI: 'public.json',
  });
}

import { Alert, Platform } from 'react-native';

type Options = { title: string; message?: string; confirmLabel?: string; destructive?: boolean };

/** Native alert / browser confirm, as a promise. */
export function confirm({
  title,
  message,
  confirmLabel = 'Confirmer',
  destructive,
}: Options): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

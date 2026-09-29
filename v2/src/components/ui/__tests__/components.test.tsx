import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { ThemeProvider } from '@/providers/theme-provider';

import { Button } from '../button';
import { TextField } from '../text-field';

jest.mock('@/lib/storage', () => {
  const store = new Map<string, string>();
  return {
    kv: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  };
});

function Form() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  return (
    <ThemeProvider>
      <TextField testID="first" label="Prénom" value={first} onChangeText={setFirst} />
      <TextField testID="last" label="Nom" value={last} onChangeText={setLast} />
    </ThemeProvider>
  );
}

describe('TextField', () => {
  it('keeps the same input while typing (v1 bug: inputs re-created → focus lost each keystroke)', async () => {
    await render(<Form />);
    const input = screen.getByTestId('first');
    await fireEvent.changeText(input, 'L');
    await fireEvent.changeText(screen.getByTestId('first'), 'Lé');
    await fireEvent.changeText(screen.getByTestId('last'), 'M');
    expect(screen.getByTestId('first')).toBe(input);
    expect(screen.getByTestId('first').props.value).toBe('Lé');
  });

  it('shows the error message', async () => {
    await render(
      <ThemeProvider>
        <TextField
          label="Email"
          value="x"
          onChangeText={() => undefined}
          error="Adresse email invalide"
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('Adresse email invalide')).toBeTruthy();
  });
});

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button title="Envoyer" onPress={onPress} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled while loading', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <Button title="Envoyer" onPress={onPress} loading />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

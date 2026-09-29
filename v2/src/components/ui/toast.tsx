import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

import { Gradient } from './gradient';
import { Text } from './text';

type Toast = {
  id: number;
  title: string;
  body?: string;
  tone?: 'default' | 'success' | 'error' | 'brand';
  onPress?: () => void;
};

type ToastContextValue = { show: (toast: Omit<Toast, 'id'>) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback(
    (id: number) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  );

  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        className="absolute left-0 right-0 items-center gap-2 px-4"
        style={{ top: insets.top + 8, pointerEvents: 'box-none' }}>
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(220)}
            exiting={FadeOutUp.duration(180)}
            className="w-full max-w-[420px]">
            <Pressable
              accessibilityRole={toast.onPress ? 'button' : 'alert'}
              accessibilityLiveRegion="polite"
              onPress={() => {
                toast.onPress?.();
                dismiss(toast.id);
              }}
              className="overflow-hidden rounded-2xl"
              style={{ boxShadow: '0px 10px 32px rgba(0,0,0,0.35)' }}>
              {toast.tone === 'brand' ? (
                <Gradient
                  direction="horizontal"
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                  <ToastBody toast={toast} light />
                </Gradient>
              ) : (
                <View
                  className={cn(
                    'border px-4 py-3',
                    toast.tone === 'error'
                      ? 'border-danger/40 bg-card'
                      : toast.tone === 'success'
                        ? 'border-success/40 bg-card'
                        : 'border-line/10 bg-surface',
                  )}>
                  <ToastBody toast={toast} />
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastBody({ toast, light }: { toast: Toast; light?: boolean }) {
  return (
    <View className="gap-0.5">
      <Text
        className={cn('text-[14px] font-extrabold', light ? 'text-white' : 'text-text')}
        numberOfLines={1}>
        {toast.title}
      </Text>
      {toast.body ? (
        <Text
          className={cn('text-[12px]', light ? 'text-white/85' : 'text-muted')}
          numberOfLines={2}>
          {toast.body}
        </Text>
      ) : null}
    </View>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

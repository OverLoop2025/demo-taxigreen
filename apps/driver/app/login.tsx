import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NumPad } from '@/components/NumPad';
import { TouchButton } from '@/components/TouchButton';
import { useAuth } from '@/features/auth/use-auth';

type Field = 'idle' | 'email' | 'pin';

export default function LoginScreen() {
  const router = useRouter();
  const { login, status } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('conductor1@taxigreen.demo');
  const [pin, setPin] = useState('');
  const [field, setField] = useState<Field>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinDots = useMemo(
    () =>
      Array.from({ length: 4 })
        .map((_, index) => (index < pin.length ? '●' : '○'))
        .join('  '),
    [pin.length],
  );

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/(auth)/home');
    }
  }, [router, status]);

  // Al pasar al PIN se cierra el teclado del sistema: el NumPad propio es el único
  // método de entrada visible (sin teclados superpuestos ni pantalla corrompida).
  function focusPin() {
    emailRef.current?.blur();
    Keyboard.dismiss();
    setField('pin');
  }

  async function submit() {
    if (pin.length !== 4 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), pin);
      router.replace('/(auth)/home');
    } catch {
      setPin('');
      setError('Ese email o PIN no coincide. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="min-h-full justify-center px-5 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md">
          <View className="mb-7 items-center">
            <View className="rounded-2xl bg-brand px-4 py-2">
              <Text className="text-xl font-bold text-ink-900">Taxi Green</Text>
            </View>
            <Text className="mt-3 text-base font-semibold text-foreground-muted">Ingreso de conductor</Text>
          </View>

          <View className="rounded-3xl border border-border bg-surface px-5 py-6">
            <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Email</Text>
            <TextInput
              ref={emailRef}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              editable={!loading}
              onFocus={() => setField('email')}
              onChangeText={setEmail}
              placeholderTextColor="#9CA3AF"
              className={`mt-2 min-h-14 rounded-xl border bg-surface-muted px-4 text-base font-semibold text-foreground ${
                field === 'email' ? 'border-brand' : 'border-border'
              }`}
            />

            <Text className="mt-5 text-xs font-bold uppercase tracking-wide text-foreground-muted">
              PIN de 4 dígitos
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ingresar PIN"
              onPress={focusPin}
              className={`mt-2 h-14 items-center justify-center rounded-xl border bg-surface-muted ${
                field === 'pin' ? 'border-brand' : 'border-border'
              }`}
            >
              <Text className="text-2xl font-bold tracking-widest text-brand">{pinDots}</Text>
            </Pressable>

            {error ? <Text className="mt-3 text-sm font-semibold text-red-500">{error}</Text> : null}

            {/* El teclado numérico aparece sólo cuando el conductor toca el PIN. */}
            {field === 'pin' ? <NumPad value={pin} onChange={setPin} disabled={loading} /> : null}

            <TouchButton
              label="Entrar"
              loading={loading}
              disabled={pin.length !== 4}
              className="mt-5"
              onPress={submit}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

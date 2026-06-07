import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { NumPad } from '@/components/NumPad';
import { TouchButton } from '@/components/TouchButton';
import { useAuth } from '@/features/auth/use-auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('conductor1@taxigreen.demo');
  const [pin, setPin] = useState('');
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
      className="flex-1 bg-ink-900"
    >
      <ScrollView contentContainerClassName="min-h-full justify-center px-5 py-10">
        <View className="mx-auto w-full max-w-md">
          <View className="mb-7 items-center">
            <View className="rounded-2xl bg-brand px-4 py-2">
              <Text className="text-xl font-bold text-ink-900">Taxi Green</Text>
            </View>
            <Text className="mt-3 text-base font-semibold text-zinc-400">Ingreso de conductor</Text>
          </View>

          <View className="rounded-3xl border border-ink-line bg-ink-800 px-5 py-6">
            <Text className="text-xs font-bold uppercase tracking-wide text-zinc-400">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              editable={!loading}
              onChangeText={setEmail}
              placeholderTextColor="#71717A"
              className="mt-2 min-h-14 rounded-xl border border-ink-line bg-ink-700 px-4 text-base font-semibold text-white"
            />

            <Text className="mt-5 text-xs font-bold uppercase tracking-wide text-zinc-400">PIN de 4 dígitos</Text>
            <View className="mt-2 h-14 items-center justify-center rounded-xl border border-ink-line bg-ink-700">
              <Text className="text-2xl font-bold tracking-widest text-brand">{pinDots}</Text>
            </View>

            {error ? <Text className="mt-3 text-sm font-semibold text-red-400">{error}</Text> : null}

            <NumPad value={pin} onChange={setPin} disabled={loading} />
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

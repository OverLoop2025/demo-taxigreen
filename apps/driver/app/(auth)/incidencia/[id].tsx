import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { TouchButton } from '@/components/TouchButton';
import { respondDriverIncident } from '@/features/incidents/client';
import type { DriverIncidentAnswer } from '@/features/incidents/types';
import { useAuth } from '@/features/auth/use-auth';
import { useRealtime } from '@/features/realtime';

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function answerLabel(answer: DriverIncidentAnswer) {
  if (answer === 'encontrado') return 'Sí encontré';
  if (answer === 'no_visto') return 'No vi nada';
  return 'Revisar en 5 min';
}

export default function IncidentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; descripcion?: string; reservaId?: string }>();
  const incidenciaId = normalizeParam(params.id);
  const descripcion = normalizeParam(params.descripcion) ?? 'Pasajero reportó un objeto olvidado.';
  const reservaId = normalizeParam(params.reservaId);
  const { session } = useAuth();
  const { clearLastIncident } = useRealtime();
  const [submitting, setSubmitting] = useState<DriverIncidentAnswer | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = useCallback(
    async (respuesta: DriverIncidentAnswer) => {
      if (!incidenciaId || !session?.token || submitting) return;
      setSubmitting(respuesta);
      setMessage(null);
      try {
        await respondDriverIncident({
          incidenciaId,
          token: session.token,
          respuesta,
        });
        clearLastIncident();
        setMessage(`${answerLabel(respuesta)} registrado.`);
      } catch (error) {
        const nextMessage = error instanceof Error ? error.message : 'No se pudo responder la incidencia.';
        setMessage(nextMessage);
      } finally {
        setSubmitting(null);
      }
    },
    [clearLastIncident, incidenciaId, session?.token, submitting],
  );

  if (!incidenciaId) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 px-6">
        <Text className="text-2xl font-bold text-product-deep">Incidencia no encontrada</Text>
        <TouchButton label="Volver" className="mt-5" onPress={() => router.replace('/(auth)/home')} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="px-5 pb-8 pt-10">
      <View className="rounded-2xl bg-product-deep px-5 py-5">
        <Text className="text-base font-semibold text-white/70">Soporte de viaje</Text>
        <Text className="mt-2 text-3xl font-bold leading-9 text-white">Objeto olvidado</Text>
        <Text className="mt-3 text-base leading-6 text-white/80">{descripcion}</Text>
        {reservaId ? <Text className="mt-2 text-sm font-semibold text-white/60">Viaje {reservaId.slice(0, 8)}</Text> : null}
      </View>

      <View className="mt-4 rounded-2xl bg-white px-5 py-5">
        <Text className="text-xl font-bold text-product-deep">Respuesta al pasajero</Text>
        <Text className="mt-3 text-base leading-6 text-gray-600">
          Revisa la unidad y responde con una sola acción. El pasajero verá el avance en su link.
        </Text>

        <View className="mt-5 gap-3">
          <TouchButton
            label="Sí encontré"
            loading={submitting === 'encontrado'}
            disabled={Boolean(submitting)}
            onPress={() => submit('encontrado')}
          />
          <TouchButton
            label="No vi nada"
            tone="secondary"
            loading={submitting === 'no_visto'}
            disabled={Boolean(submitting)}
            onPress={() => submit('no_visto')}
          />
          <TouchButton
            label="Revisar en 5 min"
            tone="ghost"
            loading={submitting === 'revisar'}
            disabled={Boolean(submitting)}
            onPress={() => submit('revisar')}
          />
        </View>

        {message ? <Text className="mt-4 text-base font-semibold text-product-deep">{message}</Text> : null}
        {submitting ? <ActivityIndicator className="mt-4" color="#10B981" /> : null}
      </View>

      <TouchButton label="Volver al inicio" tone="secondary" className="mt-5" onPress={() => router.replace('/(auth)/home')} />
    </ScrollView>
  );
}

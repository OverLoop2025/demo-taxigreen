import { expect, test } from '@playwright/test';

// El flujo guiado interactivo: el copiloto abre un chat nuevo con el selector de
// intención y va pidiendo cada dato con widgets de clic (no menús numerados). Cada
// selección fija overrides estructurados que alimentan el MISMO extractor.
// Autocontenido: no toca TG-2026-0001 ni crea reserva (solo deja el borrador).
test('WhatsApp guiado: chat nuevo con widgets termina en un borrador extraíble', async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForURL('**/wa-sim');

  // "+" crea un chat manual en blanco y arranca el selector de intención.
  await page.getByRole('button', { name: /Nuevo chat manual/i }).click();
  await expect(page.getByText(/¿En qué te puedo ayudar/i)).toBeVisible();

  // Intención → tipo de cliente → tipo de servicio (flujo A) → ámbito del vuelo.
  await page.getByRole('button', { name: /Reservar un taxi/i }).click();
  await page.getByRole('button', { name: /Viajero independiente/i }).click();
  await page.getByRole('button', { name: /Me recogen en el aeropuerto/i }).click();
  await page.getByRole('button', { name: /Nacional \(dentro del Perú\)/i }).click();

  // El número de vuelo es OPCIONAL: se puede saltar.
  await page.getByRole('button', { name: /No tengo \/ No recuerdo el código/i }).click();

  // Nombre del pasajero (widget de texto).
  await expect(page.getByText(/¿A nombre de quién va la reserva/i)).toBeVisible();
  await page.getByPlaceholder('Nombre y apellido del pasajero').fill('Bruno Salas');
  await page.getByRole('button', { name: /^Confirmar$/ }).click();

  // Fecha y hora.
  await expect(page.getByText(/¿Para cuándo necesitas el servicio/i)).toBeVisible();
  await page.locator('input[type="date"]').fill('2026-06-16');
  await page.locator('input[type="time"]').fill('09:00');
  await page.getByRole('button', { name: /Confirmar fecha y hora/i }).click();

  // Destino: escribir/pegar. Unas coordenadas se reconocen al instante (sin red).
  await expect(page.getByText(/¿A dónde te dirigimos/i)).toBeVisible();
  await page.getByRole('button', { name: /Escribir o pegar dirección/i }).click();
  await page.getByPlaceholder(/Miraflores/i).fill('-12.10800, -77.03400');
  await page.getByRole('button', { name: /^Confirmar$/ }).click();

  // Vehículo (último paso) → dispara la extracción del borrador.
  await expect(page.getByText(/Cuánto equipaje llevas/i)).toBeVisible();
  await page.getByRole('button', { name: /Sedán/i }).click();

  // El guiado alimentó al extractor: el panel del operador refleja el borrador con
  // tipo de viaje, destino guardado y una tarifa estimada (la cotización ya aparece).
  const panel = page.locator('aside').last();
  await expect(panel.locator('[data-field="tipo_viaje"]')).toContainText(/recojo/i);
  await expect(panel.locator('[data-field="destino_texto"]')).not.toContainText(/Pendiente/i);
  await expect(page.getByText(/Tarifa estimada protegida/i).first()).toBeVisible();
});

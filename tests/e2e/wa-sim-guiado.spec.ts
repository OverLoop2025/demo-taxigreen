import { expect, test } from '@playwright/test';

// F8: "Necesito reservar un taxi" (intención pura) abre el flujo guiado con
// menús numerados; cada respuesta se traduce a lenguaje natural y alimenta el
// MISMO extractor. Autocontenido (C7): no toca TG-2026-0001 ni crea reserva.
test('WhatsApp guiado: la intención pura abre menús y termina en un borrador extraíble', async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto('/login-admin?callbackUrl=/wa-sim');
  await page.getByLabel('Email').fill('admin@taxigreen.demo');
  await page.getByLabel('Contraseña').fill('demo1234');
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await page.waitForURL('**/wa-sim');

  const composer = page.getByPlaceholder('Escribe o pega un WhatsApp...');
  const enviar = page.getByRole('button', { name: /Enviar mensaje/i });

  const responder = async (texto: string) => {
    await composer.fill(texto);
    await enviar.click();
  };

  await responder('Necesito reservar un taxi');
  await expect(page.getByText(/Me recogen en el aeropuerto/i)).toBeVisible();

  await responder('1'); // me recogen en el aeropuerto
  await expect(page.getByText(/particular o va asociada a una empresa/i)).toBeVisible();

  await responder('1'); // particular
  await expect(page.getByText(/Cuántas personas viajan/i)).toBeVisible();

  await responder('1'); // viajo solo
  await expect(page.getByText(/Cuánto equipaje llevan/i)).toBeVisible();

  await responder('1'); // poco equipaje
  await expect(page.getByText(/Prefieres algún tipo de vehículo/i)).toBeVisible();

  await responder('2'); // sedán
  await expect(page.getByText(/cuéntame en un solo mensaje/i)).toBeVisible();

  await responder(
    'El pasajero es Bruno Salas, teléfono 999 888 777, llega mañana a las 9 de la mañana en el vuelo LA2233 y va a Av. Larco 345, Miraflores. Pago yo con tarjeta.',
  );

  // El guiado alimentó al extractor: el panel del operador refleja el borrador.
  const panel = page.locator('aside').last();
  await expect(panel.locator('[data-field="tipo_viaje"]')).toContainText(/recojo/i);
  await expect(panel.locator('[data-field="pasajeros_cantidad"]')).toContainText('1');
  await expect(page.getByText(/Tarifa estimada protegida/i).first()).toBeVisible();
});

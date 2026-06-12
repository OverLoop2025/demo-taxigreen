-- Feature 2: cotizacion persistida + pago demo operacional.

CREATE TYPE "EstadoPago" AS ENUM (
  'pendiente',
  'autorizado',
  'por_cobrar',
  'capturado',
  'por_liquidar',
  'rechazado'
);

ALTER TABLE "reservas"
  ADD COLUMN "cotizacion_monto" DECIMAL(10, 2),
  ADD COLUMN "cotizacion_moneda" TEXT DEFAULT 'PEN',
  ADD COLUMN "cotizacion_fuente" TEXT,
  ADD COLUMN "cotizacion_calculada_en" TIMESTAMP(3);

CREATE TABLE "pagos" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "reserva_id" TEXT NOT NULL,
  "tipo_pago" "TipoPago" NOT NULL,
  "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
  "monto" DECIMAL(10, 2) NOT NULL,
  "moneda" TEXT NOT NULL DEFAULT 'PEN',
  "proveedor_demo" TEXT,
  "autorizacion" TEXT,
  "payload_demo" JSONB,
  "autorizado_en" TIMESTAMP(3),
  "capturado_en" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pagos_reserva_id_key" ON "pagos"("reserva_id");
CREATE INDEX "pagos_tenant_id_idx" ON "pagos"("tenant_id");

ALTER TABLE "pagos"
  ADD CONSTRAINT "pagos_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pagos"
  ADD CONSTRAINT "pagos_reserva_id_fkey"
  FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

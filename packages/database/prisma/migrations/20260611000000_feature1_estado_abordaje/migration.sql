-- Feature 1: estado persistente de abordaje para separar despacho de counter.
CREATE TYPE "EstadoAbordaje" AS ENUM ('no_requerido', 'pendiente_validacion', 'autorizado');

ALTER TABLE "reservas"
  ADD COLUMN "estado_abordaje" "EstadoAbordaje" NOT NULL DEFAULT 'no_requerido',
  ADD COLUMN "counter_validado_en" TIMESTAMP(3),
  ADD COLUMN "counter_usuario_id" TEXT;

-- Backfill crítico: cualquier recojo que ya arrancó no puede quedar bloqueado por
-- una migración aplicada sobre datos de demo o producción.
UPDATE "reservas" r
SET "estado_abordaje" = 'autorizado',
    "counter_validado_en" = now()
WHERE r."tipo_viaje" = 'recojo_aeropuerto'
  AND EXISTS (
    SELECT 1
    FROM "viajes" v
    WHERE v."reserva_id" = r."id"
      AND v."deleted_at" IS NULL
      AND v."estado" IN ('en_camino', 'en_punto', 'a_bordo', 'finalizado')
  );

UPDATE "reservas"
SET "estado_abordaje" = 'pendiente_validacion'
WHERE "tipo_viaje" = 'recojo_aeropuerto'
  AND "estado_abordaje" = 'no_requerido';

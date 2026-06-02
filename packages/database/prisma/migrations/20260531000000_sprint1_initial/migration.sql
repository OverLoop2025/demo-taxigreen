-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin_tenant', 'despachador', 'supervisor', 'conductor', 'pasajero_invitado');

-- CreateEnum
CREATE TYPE "CanalOrigen" AS ENUM ('whatsapp_oficial', 'whatsapp_manual', 'web_landing', 'counter', 'llamada', 'hotel');

-- CreateEnum
CREATE TYPE "TipoViaje" AS ENUM ('recojo_aeropuerto', 'traslado_aeropuerto', 'city');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('efectivo', 'voucher_hotel', 'factura_empresa', 'app_pago');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('ingesta_pendiente', 'necesita_revision', 'confirmada', 'asignada', 'en_curso', 'finalizada', 'por_liquidar', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoViaje" AS ENUM ('asignado', 'en_camino', 'en_punto', 'a_bordo', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('boleta', 'factura', 'ticket');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('emitido', 'anulado', 'pendiente');

-- CreateEnum
CREATE TYPE "TipologiaIncidencia" AS ENUM ('objeto_olvidado', 'queja', 'seguridad', 'otro');

-- CreateEnum
CREATE TYPE "SeveridadIncidencia" AS ENUM ('baja', 'media', 'alta', 'critica');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('abierta', 'en_resolucion', 'resuelta', 'escalada', 'cerrada');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('sedan', 'camioneta', 'van', 'minivan');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "email" TEXT,
    "password_hash" BYTEA,
    "pin_hash" BYTEA,
    "fcm_token" TEXT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conductores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "licencia" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "foto_url" TEXT,
    "total_viajes" INTEGER NOT NULL DEFAULT 0,
    "tiempo_en_cola_desde" TIMESTAMP(3),
    "vehiculo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conductores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "foto_url" TEXT,
    "color" TEXT,
    "anio" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "canal_origen" "CanalOrigen" NOT NULL,
    "tipo_viaje" "TipoViaje" NOT NULL,
    "solicitante_tipo" TEXT,
    "solicitante_nombre" TEXT,
    "solicitante_contacto" TEXT,
    "pasajero_nombre" TEXT NOT NULL,
    "pasajero_telefono" TEXT NOT NULL,
    "pasajero_email" TEXT,
    "pasajero_dni" TEXT,
    "pasajero_ruc" TEXT,
    "origen_texto" TEXT NOT NULL,
    "origen_lat" DOUBLE PRECISION,
    "origen_lng" DOUBLE PRECISION,
    "destino_texto" TEXT NOT NULL,
    "destino_lat" DOUBLE PRECISION,
    "destino_lng" DOUBLE PRECISION,
    "punto_encuentro" TEXT,
    "fecha_hora_servicio" TIMESTAMP(3) NOT NULL,
    "vuelo_codigo" TEXT,
    "tipo_pago" "TipoPago" NOT NULL,
    "estado" "EstadoReserva" NOT NULL,
    "token_pasajero" TEXT NOT NULL,
    "voucher_codigo" TEXT NOT NULL,
    "voucher_qr_payload" TEXT NOT NULL,
    "voucher_emitido_en" TIMESTAMP(3),
    "raw_ingesta" JSONB,
    "sugerencia_copiloto" JSONB,
    "calificacion" JSONB,
    "empresa_nombre" TEXT,
    "hotel_nombre" TEXT,
    "conductor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viajes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "conductor_id" TEXT NOT NULL,
    "estado" "EstadoViaje" NOT NULL,
    "inicio_en_camino" TIMESTAMP(3),
    "llegada_punto" TIMESTAMP(3),
    "pasajero_a_bordo" TIMESTAMP(3),
    "finalizado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "viajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posiciones_conductor" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conductor_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "geom" geography(Point, 4326),
    "velocidad" DOUBLE PRECISION,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posiciones_conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "tipo" "TipoComprobante" NOT NULL,
    "serie" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "pdf_url" TEXT,
    "estado" "EstadoComprobante" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reserva_id" TEXT NOT NULL,
    "tipologia" "TipologiaIncidencia" NOT NULL,
    "severidad" "SeveridadIncidencia" NOT NULL,
    "estado" "EstadoIncidencia" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "tpr_seg" INTEGER,
    "tr_seg" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "incidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_tipo" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_table" TEXT,
    "target_id" TEXT,
    "payload" JSONB,
    "fuente_decision" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_nombre_key" ON "tenants"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_tenant_id_rol_idx" ON "usuarios"("tenant_id", "rol");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_usuario_id_key" ON "conductores"("usuario_id");

-- CreateIndex
CREATE INDEX "conductores_tenant_id_idx" ON "conductores"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "vehiculos_tenant_id_idx" ON "vehiculos"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_token_pasajero_key" ON "reservas"("token_pasajero");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_voucher_codigo_key" ON "reservas"("voucher_codigo");

-- CreateIndex
CREATE INDEX "reservas_tenant_id_estado_idx" ON "reservas"("tenant_id", "estado");

-- CreateIndex
CREATE INDEX "reservas_tenant_id_canal_origen_idx" ON "reservas"("tenant_id", "canal_origen");

-- CreateIndex
CREATE INDEX "reservas_tenant_id_tipo_viaje_idx" ON "reservas"("tenant_id", "tipo_viaje");

-- CreateIndex
CREATE INDEX "viajes_tenant_id_idx" ON "viajes"("tenant_id");

-- CreateIndex
CREATE INDEX "viajes_reserva_id_idx" ON "viajes"("reserva_id");

-- CreateIndex
CREATE INDEX "viajes_conductor_id_estado_idx" ON "viajes"("conductor_id", "estado");

-- CreateIndex
CREATE INDEX "posiciones_conductor_conductor_id_ts_idx" ON "posiciones_conductor"("conductor_id", "ts" DESC);

-- CreateIndex
CREATE INDEX "comprobantes_tenant_id_idx" ON "comprobantes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_tipo_serie_correlativo_key" ON "comprobantes"("tipo", "serie", "correlativo");

-- CreateIndex
CREATE INDEX "incidencias_tenant_id_estado_idx" ON "incidencias"("tenant_id", "estado");

-- CreateIndex
CREATE INDEX "incidencias_reserva_id_idx" ON "incidencias"("reserva_id");

-- CreateIndex
CREATE INDEX "auditoria_tenant_id_action_ts_idx" ON "auditoria"("tenant_id", "action", "ts" DESC);

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conductores" ADD CONSTRAINT "conductores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conductores" ADD CONSTRAINT "conductores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conductores" ADD CONSTRAINT "conductores_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "conductores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes" ADD CONSTRAINT "viajes_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "conductores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posiciones_conductor" ADD CONSTRAINT "posiciones_conductor_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posiciones_conductor" ADD CONSTRAINT "posiciones_conductor_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "conductores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;


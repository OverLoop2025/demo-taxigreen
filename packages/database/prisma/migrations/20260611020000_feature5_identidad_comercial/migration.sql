-- Feature 5: identidad comercial separa quién viaja de quién paga.
CREATE TYPE "PerfilPasajero" AS ENUM ('particular', 'corporativo', 'hotel');
CREATE TYPE "ResponsablePago" AS ENUM ('pasajero', 'empresa', 'hotel');

ALTER TABLE "reservas"
  ADD COLUMN "perfil_pasajero" "PerfilPasajero" NOT NULL DEFAULT 'particular',
  ADD COLUMN "responsable_pago" "ResponsablePago" NOT NULL DEFAULT 'pasajero',
  ADD COLUMN "convenio_validado_demo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requiere_factura" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vehiculo_preferencia" "TipoVehiculo",
  ADD COLUMN "pasajeros_cantidad" INTEGER,
  ADD COLUMN "equipaje_nivel" TEXT,
  ADD COLUMN "cancelada_por" TEXT,
  ADD COLUMN "cancelada_motivo" TEXT;

UPDATE "reservas"
SET
  "perfil_pasajero" = CASE
    WHEN "tipo_pago" = 'voucher_hotel' THEN 'hotel'::"PerfilPasajero"
    WHEN "tipo_pago" = 'factura_empresa' THEN 'corporativo'::"PerfilPasajero"
    ELSE 'particular'::"PerfilPasajero"
  END,
  "responsable_pago" = CASE
    WHEN "tipo_pago" = 'voucher_hotel' THEN 'hotel'::"ResponsablePago"
    WHEN "tipo_pago" = 'factura_empresa' THEN 'empresa'::"ResponsablePago"
    ELSE 'pasajero'::"ResponsablePago"
  END,
  "convenio_validado_demo" = CASE
    WHEN "tipo_pago" IN ('voucher_hotel', 'factura_empresa') THEN true
    ELSE false
  END,
  "requiere_factura" = CASE
    WHEN "tipo_pago" = 'factura_empresa' OR "pasajero_ruc" IS NOT NULL THEN true
    ELSE false
  END;

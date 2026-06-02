-- Extensiones requeridas (mismas que se habilitan en Supabase: postgis + pgcrypto).
-- Postgres local las crea al primer arranque del contenedor.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

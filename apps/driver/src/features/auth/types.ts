export type DriverVehicle = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidad: number;
  color: string | null;
  anio: number | null;
} | null;

export type DriverProfile = {
  userId: string;
  conductorId: string;
  tenantId: string;
  nombre: string;
  email: string;
  telefono: string | null;
  licencia: string;
  rating: number;
  totalViajes: number;
  vehiculo: DriverVehicle;
};

export type DriverSession = {
  token: string;
  expiresAt: number;
  conductor: DriverProfile;
};

export type LoginResponse = {
  token: string;
  expiresIn: number;
  conductor: DriverProfile;
};

import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { withUpdateMeta } from '@/utils/withUpdateMeta';
import { updateUser } from '@/global/session.service';

const BASE = `${SERVER_ROUTE}/api/usuarios`;

export interface UpdateProfileDTO {
  nombre: string;
  apellido: string;
}

export interface UpdatePinDTO {
  pin: string;
}

export const updateProfile = async (id: number, data: UpdateProfileDTO) => {
  const result = await http.patch<{ nombre: string; apellido: string }>(
    `${BASE}/${id}`,
    withUpdateMeta(data),
  );
  updateUser({ nombre: data.nombre, apellido: data.apellido });
  return result;
};

export const updatePin = async (id: number, data: UpdatePinDTO) => {
  const result = await http.patch<{ pin: string }>(
    `${BASE}/${id}`,
    withUpdateMeta(data),
  );
  updateUser({ pin: data.pin });
  return result;
};

import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';

const BASE = `${SERVER_ROUTE}/api/usuarios`;

export const changePasswordService = async (
  userId: number,
  data: { current_password: string; new_password: string },
): Promise<{ message: string }> => {
  return await http.patch<{ message: string }>(`${BASE}/${userId}/change-password`, data);
};

import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Mail, MailCreateDTO, MailUpdateDTO, MailFilters, PaginatedResponse } from './mail.types';

const BASE = `${SERVER_ROUTE}/api/mail/send`;
export const getAll = async () => {
  return await http.get<Mail[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Mail>(`${BASE}/${id}`);
};

export const create = async (data: MailCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Mail>(BASE, payload);
};

export const update = async (id: number, data: MailUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Mail>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: MailFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Mail>>(`${BASE}/paginated?${query}`);
  return response;
};

const buildQuery = (params: object): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

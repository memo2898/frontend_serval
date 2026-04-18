import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Uploads, UploadsCreateDTO, UploadsUpdateDTO, UploadsFilters, PaginatedResponse } from './uploads.types';

const BASE = `${SERVER_ROUTE}/api/uploads`;


// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  path: string;
  count: number;
  files: UploadedFile[];
}


// ─── Upload single image  →  POST /api/uploads/image ─────────────────────────

export const uploadImage = async (
  folder: string,
  file: File,
): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch(`${BASE}/image`, {
    method: 'POST',
    body: formData,
  });

  const data: any = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al subir la imagen');
  }

  return data.image;
};


// ─── Upload multiple files  →  POST /api/uploads/files ───────────────────────

export const uploadFiles = async (
  folder: string,
  files: File[],
): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);

  const res = await fetch(`${BASE}/files`, {
    method: 'POST',
    body: formData,
  });

  const data: UploadResponse & { statusCode?: number; error?: string } = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al subir el archivo');
  }

  return data;
};


// ─── Get file URL  →  GET /api/uploads/* ─────────────────────────────────────

export const getFileUrl = async (filePath: string): Promise<string> => {
  const res = await fetch(`${BASE}/${filePath}`);

  if (!res.ok) {
    throw new Error('Archivo no encontrado');
  }

  const data: any = await res.json();
  return data.url ?? `${BASE}/${filePath}`;
};


// ─── CRUD methods (used by UploadsFeature) ───────────────────────────────────

export const getAll = async (): Promise<Uploads[]> => {
  return await http.get<Uploads[]>(BASE);
};

export const create = async (data: UploadsCreateDTO): Promise<Uploads> => {
  return await http.post<Uploads>(BASE, data);
};

export const update = async (id: number, data: UploadsUpdateDTO): Promise<Uploads> => {
  return await http.patch<Uploads>(`${BASE}/${id}`, data);
};

export const remove = async (id: number): Promise<void> => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: UploadsFilters = {}): Promise<PaginatedResponse<Uploads>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return await http.get<PaginatedResponse<Uploads>>(`${BASE}/paginated?${query.toString()}`);
};


// ─── Delete file  →  DELETE /api/uploads/* ───────────────────────────────────

export const deleteFile = async (filePath: string): Promise<void> => {
  const res = await fetch(`${BASE}/${filePath}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error al eliminar el archivo');
  }
};


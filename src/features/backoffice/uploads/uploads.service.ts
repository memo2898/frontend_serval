import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';

const BASE = `${SERVER_ROUTE}/api/uploads`;



// ─── Upload multipart ─────────────────────────────────────────────────────────

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


// ─── Upload single image ──────────────────────────────────────────────────────

export const uploadImage = async (
  path: string,
  file: File,
): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE}/image?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    body: formData,
  });

  const data: any = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al subir la imagen');
  }

  return data.image; // <-- antes era data.files[0]
};

export const uploadFiles = async (
  path: string,
  files: File[],
): Promise<UploadResponse> => {
  //const { getToken } = await import('@/global/session.service');
  //const token = getToken();

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${BASE}?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    //headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data: UploadResponse & { statusCode?: number; error?: string } = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Error al subir el archivo');
  }

  return data;
};


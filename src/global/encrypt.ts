interface StorageResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T | null;
}

export class EncryptedStorage {
  private secretKey: string;

  constructor(secretKey = '@@ADN_inventario@@') {
    this.secretKey = secretKey;
  }

  private encrypt(data: unknown): string {
    const str = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  }

  private decrypt<T>(encryptedData: string): T | null {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') return null;
      const cleanData = encryptedData.trim();
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanData)) return null;
      const decoded = atob(cleanData);
      let original = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
        original += String.fromCharCode(charCode);
      }
      return JSON.parse(original) as T;
    } catch {
      return null;
    }
  }

  create(key: string, value: unknown): StorageResult {
    try {
      localStorage.setItem(key, this.encrypt(value));
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  read<T = unknown>(key: string): StorageResult<T> {
    try {
      const encrypted = localStorage.getItem(key);
      if (encrypted === null) return { success: false, message: 'Clave no encontrada', data: null };
      const data = this.decrypt<T>(encrypted);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: (error as Error).message, data: null };
    }
  }

  update(key: string, newValue: unknown): StorageResult {
    try {
      if (localStorage.getItem(key) === null) return { success: false, message: 'Clave no encontrada' };
      localStorage.setItem(key, this.encrypt(newValue));
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  delete(key: string): StorageResult {
    try {
      if (localStorage.getItem(key) === null) return { success: false, message: 'Clave no encontrada' };
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  clear(): StorageResult {
    localStorage.clear();
    return { success: true };
  }
}

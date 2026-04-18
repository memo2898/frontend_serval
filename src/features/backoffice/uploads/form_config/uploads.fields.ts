import { InputX } from '@/lib/uiX/components/InputX';
import type { Uploads } from '../uploads.types';

export function getUploadsFields(
  initialData: Uploads | null
): HTMLElement[] {
  return [
    InputX({
      name: '0',
      label: '0',
      placeholder: 'Ingrese 0',
      type: 'text',
      defaultValue: initialData?.[0] != null ? String(initialData[0]) : '',
      rules: {
        validations: [
          { type: 'required', message: '0 es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

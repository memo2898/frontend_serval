import { InputX } from '@/lib/uiX/components/InputX';
import type { Auth } from '../auth.types';

export function getAuthFields(
  initialData: Auth | null
): HTMLElement[] {
  return [
    InputX({
      name: 'username',
      label: 'Username',
      placeholder: 'Ingrese username',
      type: 'text',
      defaultValue: initialData?.username != null ? String(initialData.username) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Username es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'password',
      label: 'Password',
      placeholder: 'Ingrese password',
      type: 'text',
      defaultValue: initialData?.password != null ? String(initialData.password) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Password es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

import { InputX } from '@/lib/uiX/components/InputX';
import type { Mail } from '../mail.types';

export function getMailFields(
  initialData: Mail | null
): HTMLElement[] {
  return [
    InputX({
      name: 'to',
      label: 'To',
      placeholder: 'Ingrese to',
      type: 'text',
      defaultValue: initialData?.to != null ? String(initialData.to) : '',
      rules: {
        validations: [
          { type: 'required', message: 'To es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'subject',
      label: 'Subject',
      placeholder: 'Ingrese subject',
      type: 'text',
      defaultValue: initialData?.subject != null ? String(initialData.subject) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Subject es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'html',
      label: 'Html',
      placeholder: 'Ingrese html',
      type: 'text',
      defaultValue: initialData?.html != null ? String(initialData.html) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Html es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

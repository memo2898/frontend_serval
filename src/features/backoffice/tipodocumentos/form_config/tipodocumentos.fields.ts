import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { TipoDocumentos } from '../tipodocumentos.types';

export function getTipoDocumentosFields(
  initialData: TipoDocumentos | null
): HTMLElement[] {
  return [
    InputX({
      name: 'tipo',
      label: 'Tipo',
      placeholder: 'Ingrese tipo',
      type: 'text',
      defaultValue: initialData?.tipo != null ? String(initialData.tipo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tipo es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    SelectX({
      name: 'aplica_a',
      label: 'Aplica A',
      placeholder: 'Seleccionar...',
      options: [],
      defaultValue: initialData?.aplica_a != null ? String(initialData.aplica_a) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Aplica A es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'tipo_validacion',
      label: 'Tipo Validacion',
      placeholder: 'Ingrese tipo validacion',
      type: 'text',
      defaultValue: initialData?.tipo_validacion != null ? String(initialData.tipo_validacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tipo Validacion es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'regex_validacion',
      label: 'Regex Validacion',
      placeholder: 'Ingrese regex validacion',
      type: 'text',
      defaultValue: initialData?.regex_validacion != null ? String(initialData.regex_validacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Regex Validacion es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'funcion_validacion',
      label: 'Funcion Validacion',
      placeholder: 'Ingrese funcion validacion',
      type: 'text',
      defaultValue: initialData?.funcion_validacion != null ? String(initialData.funcion_validacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Funcion Validacion es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'formato_ejemplo',
      label: 'Formato Ejemplo',
      placeholder: 'Ingrese formato ejemplo',
      type: 'text',
      defaultValue: initialData?.formato_ejemplo != null ? String(initialData.formato_ejemplo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Formato Ejemplo es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

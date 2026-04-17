import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { TipoDocumentos } from '../tipodocumentos.types';

const APLICA_A_OPTIONS = [
  { value: 'persona_fisica',   label: 'Persona Física' },
  { value: 'persona_juridica', label: 'Persona Jurídica' },
  { value: 'ambos',            label: 'Ambos' },
];

const TIPO_VALIDACION_OPTIONS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'regex',   label: 'Regex' },
  { value: 'funcion', label: 'Función' },
  { value: 'ambos',   label: 'Ambos' },
];

const ESTADO_OPTIONS = [
  { value: 'activo',   label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

function showsRegex(val: string): boolean {
  return val === 'regex' || val === 'ambos';
}

function showsFuncion(val: string): boolean {
  return val === 'funcion' || val === 'ambos';
}

export function getTipoDocumentosFields(
  initialData: TipoDocumentos | null
): HTMLElement[] {
  const tipoValidacionInit = initialData?.tipo_validacion ?? 'ninguna';

  const regexField = InputX({
    name: 'regex_validacion',
    label: 'Regex Validación',
    placeholder: 'Ej: ^[\\d\\-\\s]{11,13}$',
    type: 'text',
    defaultValue: initialData?.regex_validacion != null ? String(initialData.regex_validacion) : '',
    rules: { validations: [] },
  });

  const funcionField = InputX({
    name: 'funcion_validacion',
    label: 'Función Validación',
    placeholder: 'Ej: (valor) => valor.length === 11',
    type: 'text',
    defaultValue: initialData?.funcion_validacion != null ? String(initialData.funcion_validacion) : '',
    rules: { validations: [] },
  });

  regexField.style.display   = showsRegex(tipoValidacionInit)   ? '' : 'none';
  funcionField.style.display = showsFuncion(tipoValidacionInit) ? '' : 'none';

  const tipoValidacionSelect = SelectX({
    name: 'tipo_validacion',
    label: 'Tipo Validación',
    placeholder: 'Seleccionar...',
    options: TIPO_VALIDACION_OPTIONS,
    defaultValue: tipoValidacionInit,
    rules: {
      validations: [
        { type: 'required', message: 'Tipo Validación es obligatorio' },
      ],
    },
    onChange: (value) => {
      const v = (value as string) ?? 'ninguna';
      regexField.style.display   = showsRegex(v)   ? '' : 'none';
      funcionField.style.display = showsFuncion(v) ? '' : 'none';
    },
  });

  return [
    InputX({
      name: 'tipo',
      label: 'Tipo',
      placeholder: 'Ej: Cédula, Pasaporte, RNC',
      type: 'text',
      defaultValue: initialData?.tipo != null ? String(initialData.tipo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tipo es obligatorio' },
          { type: 'maxLength', value: 45 },
        ],
      },
    }),
    SelectX({
      name: 'aplica_a',
      label: 'Aplica A',
      placeholder: 'Seleccionar...',
      options: APLICA_A_OPTIONS,
      defaultValue: initialData?.aplica_a != null ? String(initialData.aplica_a) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Aplica A es obligatorio' },
        ],
      },
    }),
    tipoValidacionSelect,
    regexField,
    funcionField,
    InputX({
      name: 'formato_ejemplo',
      label: 'Formato Ejemplo',
      placeholder: 'Ej: 000-0000000-0',
      type: 'text',
      defaultValue: initialData?.formato_ejemplo != null ? String(initialData.formato_ejemplo) : '',
      rules: { validations: [] },
    }),
    SelectX({
      name: 'estado',
      label: 'Estado',
      placeholder: 'Seleccionar...',
      options: ESTADO_OPTIONS,
      defaultValue: initialData?.estado ?? 'activo',
      rules: {
        validations: [
          { type: 'required', message: 'Estado es obligatorio' },
        ],
      },
    }),
  ];
}

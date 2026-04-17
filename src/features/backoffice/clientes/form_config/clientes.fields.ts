import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Clientes } from '../clientes.types';

export function getClientesFields(
  initialData: Clientes | null,
  options: {
    empresasOptions: Array<{ value: number; label: string }>;
    tipoDocumentosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'empresa_id',
      label: 'Empresa Id',
      placeholder: 'Seleccionar...',
      options: options.empresasOptions ?? [],
      defaultValue: initialData?.empresa_id != null ? String(initialData.empresa_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    InputX({
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Ingrese nombre',
      type: 'text',
      defaultValue: initialData?.nombre != null ? String(initialData.nombre) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'apellido',
      label: 'Apellido',
      placeholder: 'Ingrese apellido',
      type: 'text',
      defaultValue: initialData?.apellido != null ? String(initialData.apellido) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'email',
      label: 'Email',
      placeholder: 'Ingrese email',
      type: 'text',
      defaultValue: initialData?.email != null ? String(initialData.email) : '',
      rules: {
        validations: [
          { type: 'email' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'telefono',
      label: 'Telefono',
      placeholder: 'Ingrese telefono',
      type: 'text',
      defaultValue: initialData?.telefono != null ? String(initialData.telefono) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    SelectX({
      name: 'tipo_documento_id',
      label: 'Tipo Documento Id',
      placeholder: 'Seleccionar...',
      options: options.tipoDocumentosOptions ?? [],
      defaultValue: initialData?.tipo_documento_id != null ? String(initialData.tipo_documento_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    InputX({
      name: 'numero_documento',
      label: 'Numero Documento',
      placeholder: 'Ingrese numero documento',
      type: 'text',
      defaultValue: initialData?.numero_documento != null ? String(initialData.numero_documento) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'direccion',
      label: 'Direccion',
      placeholder: 'Ingrese direccion',
      type: 'text',
      defaultValue: initialData?.direccion != null ? String(initialData.direccion) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

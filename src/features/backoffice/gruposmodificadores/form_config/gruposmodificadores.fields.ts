import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { GruposModificadores } from '../gruposmodificadores.types';

export function getGruposModificadoresFields(
  initialData: GruposModificadores | null
): HTMLElement[] {
  return [
    InputX({
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Ingrese nombre',
      type: 'text',
      defaultValue: initialData?.nombre != null ? String(initialData.nombre) : '',
      rules: {
        validations: [
          { type: 'required' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    SelectX({
      name: 'tipo',
      label: 'Tipo',
      placeholder: 'Seleccione tipo',
      defaultValue: initialData?.tipo ?? '',
      options: [
        { value: 'articulo',    label: 'Artículo' },
        { value: 'comentario',  label: 'Comentario' },
      ],
      rules: {
        validations: [{ type: 'required' }],
      },
    }),
    SelectX({
      name: 'seleccion',
      label: 'Selección',
      placeholder: 'Seleccione tipo de selección',
      defaultValue: initialData?.seleccion ?? '',
      options: [
        { value: 'unica',    label: 'Única' },
        { value: 'multiple', label: 'Múltiple' },
      ],
      rules: {
        validations: [{ type: 'required' }],
      },
    }),
    InputX({
      name: 'obligatorio',
      label: 'Obligatorio',
      placeholder: 'Ingrese obligatorio',
      type: 'checkbox',
      defaultValue: initialData?.obligatorio != null ? String(initialData.obligatorio) : '',
      rules: {
        validations: [],
      },
    }),
    InputX({
      name: 'min_seleccion',
      label: 'Min Seleccion',
      placeholder: 'Ingrese min seleccion',
      type: 'number',
      defaultValue: initialData?.min_seleccion != null ? String(initialData.min_seleccion) : '',
      rules: {
        validations: [
          { type: 'required' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'max_seleccion',
      label: 'Max Seleccion',
      placeholder: 'Ingrese max seleccion',
      type: 'number',
      defaultValue: initialData?.max_seleccion != null ? String(initialData.max_seleccion) : '',
      rules: {
        validations: [
          { type: 'required' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}

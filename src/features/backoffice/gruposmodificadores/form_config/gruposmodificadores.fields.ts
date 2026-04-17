import { InputX } from '@/lib/uiX/components/InputX';
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
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'tipo',
      label: 'Tipo',
      placeholder: 'Ingrese tipo',
      type: 'text',
      defaultValue: initialData?.tipo != null ? String(initialData.tipo) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'seleccion',
      label: 'Seleccion',
      placeholder: 'Ingrese seleccion',
      type: 'text',
      defaultValue: initialData?.seleccion != null ? String(initialData.seleccion) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'obligatorio',
      label: 'Obligatorio',
      placeholder: 'Ingrese obligatorio',
      type: 'checkbox',
      defaultValue: initialData?.obligatorio != null ? String(initialData.obligatorio) : '',
      rules: {
        validations: [
        ],
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
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}

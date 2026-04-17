import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Ordenes } from '../ordenes.types';

export function getOrdenesFields(
  initialData: Ordenes | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
    terminalesOptions: Array<{ value: number; label: string }>;
    usuariosOptions: Array<{ value: number; label: string }>;
    mesasOptions: Array<{ value: number; label: string }>;
    clientesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'sucursal_id',
      label: 'Sucursal Id',
      placeholder: 'Seleccionar...',
      options: options.sucursalesOptions ?? [],
      defaultValue: initialData?.sucursal_id != null ? String(initialData.sucursal_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    SelectX({
      name: 'terminal_id',
      label: 'Terminal Id',
      placeholder: 'Seleccionar...',
      options: options.terminalesOptions ?? [],
      defaultValue: initialData?.terminal_id != null ? String(initialData.terminal_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    SelectX({
      name: 'usuario_id',
      label: 'Usuario Id',
      placeholder: 'Seleccionar...',
      options: options.usuariosOptions ?? [],
      defaultValue: initialData?.usuario_id != null ? String(initialData.usuario_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    SelectX({
      name: 'mesa_id',
      label: 'Mesa Id',
      placeholder: 'Seleccionar...',
      options: options.mesasOptions ?? [],
      defaultValue: initialData?.mesa_id != null ? String(initialData.mesa_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    SelectX({
      name: 'cliente_id',
      label: 'Cliente Id',
      placeholder: 'Seleccionar...',
      options: options.clientesOptions ?? [],
      defaultValue: initialData?.cliente_id != null ? String(initialData.cliente_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    InputX({
      name: 'turno_id',
      label: 'Turno Id',
      placeholder: 'Ingrese turno id',
      type: 'number',
      defaultValue: initialData?.turno_id != null ? String(initialData.turno_id) : '',
      rules: {
        validations: [
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'tipo_servicio',
      label: 'Tipo Servicio',
      placeholder: 'Ingrese tipo servicio',
      type: 'text',
      defaultValue: initialData?.tipo_servicio != null ? String(initialData.tipo_servicio) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'numero_orden',
      label: 'Numero Orden',
      placeholder: 'Ingrese numero orden',
      type: 'number',
      defaultValue: initialData?.numero_orden != null ? String(initialData.numero_orden) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'descuento_total',
      label: 'Descuento Total',
      placeholder: 'Ingrese descuento total',
      type: 'number',
      defaultValue: initialData?.descuento_total != null ? String(initialData.descuento_total) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'subtotal',
      label: 'Subtotal',
      placeholder: 'Ingrese subtotal',
      type: 'number',
      defaultValue: initialData?.subtotal != null ? String(initialData.subtotal) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'impuestos_total',
      label: 'Impuestos Total',
      placeholder: 'Ingrese impuestos total',
      type: 'number',
      defaultValue: initialData?.impuestos_total != null ? String(initialData.impuestos_total) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'total',
      label: 'Total',
      placeholder: 'Ingrese total',
      type: 'number',
      defaultValue: initialData?.total != null ? String(initialData.total) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'notas',
      label: 'Notas',
      placeholder: 'Ingrese notas',
      type: 'text',
      defaultValue: initialData?.notas != null ? String(initialData.notas) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'fecha_apertura',
      label: 'Fecha Apertura',
      placeholder: 'Ingrese fecha apertura',
      type: 'text',
      defaultValue: initialData?.fecha_apertura != null ? String(initialData.fecha_apertura) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'fecha_cierre',
      label: 'Fecha Cierre',
      placeholder: 'Ingrese fecha cierre',
      type: 'text',
      defaultValue: initialData?.fecha_cierre != null ? String(initialData.fecha_cierre) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

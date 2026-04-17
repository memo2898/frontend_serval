import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Reservaciones } from '../reservaciones.types';

export function getReservacionesFields(
  initialData: Reservaciones | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
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
      name: 'nombre_contacto',
      label: 'Nombre Contacto',
      placeholder: 'Ingrese nombre contacto',
      type: 'text',
      defaultValue: initialData?.nombre_contacto != null ? String(initialData.nombre_contacto) : '',
      rules: {
        validations: [
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
    InputX({
      name: 'fecha_hora',
      label: 'Fecha Hora',
      placeholder: 'Ingrese fecha hora',
      type: 'text',
      defaultValue: initialData?.fecha_hora != null ? String(initialData.fecha_hora) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'duracion_min',
      label: 'Duracion Min',
      placeholder: 'Ingrese duracion min',
      type: 'number',
      defaultValue: initialData?.duracion_min != null ? String(initialData.duracion_min) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'num_personas',
      label: 'Num Personas',
      placeholder: 'Ingrese num personas',
      type: 'number',
      defaultValue: initialData?.num_personas != null ? String(initialData.num_personas) : '',
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
      name: 'cancelada_en',
      label: 'Cancelada En',
      placeholder: 'Ingrese cancelada en',
      type: 'text',
      defaultValue: initialData?.cancelada_en != null ? String(initialData.cancelada_en) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'cancelada_por',
      label: 'Cancelada Por',
      placeholder: 'Ingrese cancelada por',
      type: 'number',
      defaultValue: initialData?.cancelada_por != null ? String(initialData.cancelada_por) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'motivo_cancelacion',
      label: 'Motivo Cancelacion',
      placeholder: 'Ingrese motivo cancelacion',
      type: 'text',
      defaultValue: initialData?.motivo_cancelacion != null ? String(initialData.motivo_cancelacion) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}

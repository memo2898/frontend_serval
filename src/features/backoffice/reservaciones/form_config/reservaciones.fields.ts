import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { SelectXElement } from '@/lib/uiX/components/SelectX/SelectX';
import type { Reservaciones } from '../reservaciones.types';

const ESTADOS_OPTIONS = [
  { value: 'pendiente',  label: 'Pendiente'  },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'sentada',    label: 'Sentada'    },
  { value: 'cancelada',  label: 'Cancelada'  },
  { value: 'no_show',    label: 'No show'    },
];

export function getReservacionesFields(
  initialData: Reservaciones | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
    mesasOptions: Array<{ value: number; label: string }>;
    clientesOptions: Array<{ value: number; label: string }>;
    onSucursalChange?: (sucursalId: number | null, mesaEl: SelectXElement) => void;
  }
): HTMLElement[] {
  const hasSucursal = initialData?.sucursal_id != null;

  const mesaEl = SelectX({
    name: 'mesa_id',
    label: 'Mesa',
    placeholder: hasSucursal ? 'Seleccionar...' : 'Seleccione una sucursal primero',
    options: options.mesasOptions ?? [],
    defaultValue: initialData?.mesa_id != null ? String(initialData.mesa_id) : '',
    disabled: !hasSucursal,
    rules: {
      validations: [{ type: 'required' }],
    },
  });

  return [
    SelectX({
      name: 'sucursal_id',
      label: 'Sucursal',
      placeholder: 'Seleccionar...',
      options: options.sucursalesOptions ?? [],
      defaultValue: initialData?.sucursal_id != null ? String(initialData.sucursal_id) : '',
      rules: {
        validations: [{ type: 'required' }],
      },
      onChange: (value) => {
        options.onSucursalChange?.(value != null ? Number(value) : null, mesaEl);
      },
    }),
    mesaEl,
    InputX({
      name: 'nombre_contacto',
      label: 'Nombre Contacto',
      placeholder: 'Ingrese nombre contacto',
      type: 'text',
      defaultValue: initialData?.nombre_contacto != null ? String(initialData.nombre_contacto) : '',
      rules: {
        validations: [
          { type: 'required' },
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
          { type: 'required' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'fecha_hora',
      label: 'Fecha y hora',
      placeholder: '',
      type: 'datetime-local',
      defaultValue: initialData?.fecha_hora != null ? String(initialData.fecha_hora) : '',
      rules: {
        validations: [{ type: 'required' }],
      },
    }),
    InputX({
      name: 'num_personas',
      label: 'Num Personas',
      placeholder: 'Ingrese num personas',
      type: 'number',
      defaultValue: initialData?.num_personas != null ? String(initialData.num_personas) : '',
      rules: {
        validations: [{ type: 'required' }],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    SelectX({
      name: 'estado',
      label: 'Estado',
      placeholder: 'Seleccionar...',
      options: ESTADOS_OPTIONS,
      defaultValue: initialData?.estado ?? 'pendiente',
      rules: { validations: [{ type: 'required' }] },
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
  ];
}

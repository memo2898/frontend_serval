import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { ConfiguracionSucursal } from '../configuracionsucursal.types';

export function getConfiguracionSucursalFields(
  initialData: ConfiguracionSucursal | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
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
          { type: 'required', message: 'Sucursal Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'tiene_mesas',
      label: 'Tiene Mesas',
      placeholder: 'Ingrese tiene mesas',
      type: 'checkbox',
      defaultValue: initialData?.tiene_mesas != null ? String(initialData.tiene_mesas) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tiene Mesas es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'tiene_delivery',
      label: 'Tiene Delivery',
      placeholder: 'Ingrese tiene delivery',
      type: 'checkbox',
      defaultValue: initialData?.tiene_delivery != null ? String(initialData.tiene_delivery) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tiene Delivery es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'tiene_barra',
      label: 'Tiene Barra',
      placeholder: 'Ingrese tiene barra',
      type: 'checkbox',
      defaultValue: initialData?.tiene_barra != null ? String(initialData.tiene_barra) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tiene Barra es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'impuesto_defecto_id',
      label: 'Impuesto Defecto Id',
      placeholder: 'Ingrese impuesto defecto id',
      type: 'number',
      defaultValue: initialData?.impuesto_defecto_id != null ? String(initialData.impuesto_defecto_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Impuesto Defecto Id es obligatorio' },
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'tarifa_defecto_id',
      label: 'Tarifa Defecto Id',
      placeholder: 'Ingrese tarifa defecto id',
      type: 'number',
      defaultValue: initialData?.tarifa_defecto_id != null ? String(initialData.tarifa_defecto_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tarifa Defecto Id es obligatorio' },
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'moneda',
      label: 'Moneda',
      placeholder: 'Ingrese moneda',
      type: 'text',
      defaultValue: initialData?.moneda != null ? String(initialData.moneda) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Moneda es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'formato_fecha',
      label: 'Formato Fecha',
      placeholder: 'Ingrese formato fecha',
      type: 'text',
      defaultValue: initialData?.formato_fecha != null ? String(initialData.formato_fecha) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Formato Fecha es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'zona_horaria',
      label: 'Zona Horaria',
      placeholder: 'Ingrese zona horaria',
      type: 'text',
      defaultValue: initialData?.zona_horaria != null ? String(initialData.zona_horaria) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Zona Horaria es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'permite_venta_sin_stock',
      label: 'Permite Venta Sin Stock',
      placeholder: 'Ingrese permite venta sin stock',
      type: 'checkbox',
      defaultValue: initialData?.permite_venta_sin_stock != null ? String(initialData.permite_venta_sin_stock) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Permite Venta Sin Stock es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'requiere_mesa_para_orden',
      label: 'Requiere Mesa Para Orden',
      placeholder: 'Ingrese requiere mesa para orden',
      type: 'checkbox',
      defaultValue: initialData?.requiere_mesa_para_orden != null ? String(initialData.requiere_mesa_para_orden) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Requiere Mesa Para Orden es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'imprime_automatico_al_cerrar',
      label: 'Imprime Automatico Al Cerrar',
      placeholder: 'Ingrese imprime automatico al cerrar',
      type: 'checkbox',
      defaultValue: initialData?.imprime_automatico_al_cerrar != null ? String(initialData.imprime_automatico_al_cerrar) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Imprime Automatico Al Cerrar es obligatorio' },
        ],
      },
    }),
  ];
}

import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { ArticuloGruposModificadores } from '../articulogruposmodificadores.types';

export function getArticuloGruposModificadoresFields(
  initialData: ArticuloGruposModificadores | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'articulo_id',
      label: 'Articulo Id',
      placeholder: 'Seleccionar...',
      options: options.articulosOptions ?? [],
      defaultValue: initialData?.articulo_id != null ? String(initialData.articulo_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    InputX({
      name: 'grupo_modificador_id',
      label: 'Grupo Modificador Id',
      placeholder: 'Ingrese grupo modificador id',
      type: 'number',
      defaultValue: initialData?.grupo_modificador_id != null ? String(initialData.grupo_modificador_id) : '',
      rules: {
        validations: [
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    SelectX({
      name: 'articuloId',
      label: 'ArticuloId',
      placeholder: 'Seleccionar...',
      options: options.articulosOptions ?? [],
      defaultValue: initialData?.articuloId != null ? String(initialData.articuloId) : '',
      rules: {
        validations: [
          { type: 'required', message: 'ArticuloId es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'grupoId',
      label: 'GrupoId',
      placeholder: 'Ingrese grupoid',
      type: 'number',
      defaultValue: initialData?.grupoId != null ? String(initialData.grupoId) : '',
      rules: {
        validations: [
          { type: 'required', message: 'GrupoId es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}

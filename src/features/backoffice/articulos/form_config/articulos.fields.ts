import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import { InputFileX } from '@/lib/uiX';
import type { Articulos } from '../articulos.types';

export function getArticulosFields(
  initialData: Articulos | null,
  options: {
    familiasOptions: Array<{ value: number; label: string }>;
    subfamiliasOptions: Array<{ value: number; label: string; familia_id?: number }>;
    impuestosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  // Opciones iniciales de subfamilia filtradas por la familia actual
  const initialSubfamiliaOptions = initialData?.familia_id != null
    ? options.subfamiliasOptions.filter(o => o.familia_id === initialData.familia_id)
    : options.subfamiliasOptions;

  // Crear subfamilia primero para tener referencia al elemento
  const subfamiliaEl = SelectX({
    name: 'subfamilia_id',
    label: 'Subfamilia',
    placeholder: 'Seleccionar...',
    options: initialSubfamiliaOptions,
    defaultValue: initialData?.subfamilia_id != null ? String(initialData.subfamilia_id) : '',
    // Sin validación requerida
  });

  const familiaEl = SelectX({
    name: 'familia_id',
    label: 'Familia',
    placeholder: 'Seleccionar...',
    options: options.familiasOptions ?? [],
    defaultValue: initialData?.familia_id != null ? String(initialData.familia_id) : '',
    rules: {
      validations: [
        { type: 'required', message: 'Familia es obligatorio' },
      ],
    },
    onChange: (value) => {
      const familiaId = value != null ? Number(value) : null;
      const filtered = familiaId != null
        ? options.subfamiliasOptions.filter(o => o.familia_id === familiaId)
        : options.subfamiliasOptions;
      subfamiliaEl.options = filtered;
      // Limpiar selección de subfamilia al cambiar familia
      const sfEl = subfamiliaEl as any;
      sfEl._selectedOption = null;
      sfEl._searchText = '';
      if (sfEl._inputEl) sfEl._inputEl.value = '';
      sfEl._updateClearBtn?.();
    },
  });

  return [
    familiaEl,
    subfamiliaEl,
    InputX({
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Ingrese nombre',
      type: 'text',
      defaultValue: initialData?.nombre != null ? String(initialData.nombre) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Nombre es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'descripcion',
      label: 'Descripcion',
      placeholder: 'Ingrese descripcion',
      type: 'text',
      defaultValue: initialData?.descripcion != null ? String(initialData.descripcion) : '',
    }),
    // InputX({
    //   name: 'referencia',
    //   label: 'Referencia',
    //   placeholder: 'Ingrese referencia',
    //   type: 'text',
    //   defaultValue: initialData?.referencia != null ? String(initialData.referencia) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Referencia es obligatorio' },
    //       { type: 'maxLength', value: 255 },
    //     ],
    //   },
    // }),
    // InputX({
    //   name: 'codigo_barras',
    //   label: 'Codigo Barras',
    //   placeholder: 'Ingrese codigo barras',
    //   type: 'text',
    //   defaultValue: initialData?.codigo_barras != null ? String(initialData.codigo_barras) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Codigo Barras es obligatorio' },
    //       { type: 'maxLength', value: 255 },
    //     ],
    //   },
    // }),
    // InputX({
    //   name: 'coste',
    //   label: 'Coste',
    //   placeholder: 'Ingrese coste',
    //   type: 'number',
    //   defaultValue: initialData?.coste != null ? String(initialData.coste) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Coste es obligatorio' },
    //     ],
    //     restrictions: [{ type: 'onlyDecimals' }],
    //   },
    // }),
    InputX({
      name: 'precio_venta',
      label: 'Precio Venta',
      placeholder: 'Ingrese precio venta',
      type: 'number',
      defaultValue: initialData?.precio_venta != null ? String(initialData.precio_venta) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio Venta es obligatorio' },
        ],
        restrictions: [{ type: 'onlyDecimals' }],
      },
    }),
    // InputX({
    //   name: 'tiene_stock',
    //   label: 'Tiene Stock',
    //   placeholder: 'Ingrese tiene stock',
    //   type: 'checkbox',
    //   defaultValue: initialData?.tiene_stock != null ? String(initialData.tiene_stock) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Tiene Stock es obligatorio' },
    //     ],
    //   },
    // }),
    // InputX({
    //   name: 'vendido_por_peso',
    //   label: 'Vendido Por Peso',
    //   placeholder: 'Ingrese vendido por peso',
    //   type: 'checkbox',
    //   defaultValue: initialData?.vendido_por_peso != null ? String(initialData.vendido_por_peso) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Vendido Por Peso es obligatorio' },
    //     ],
    //   },
    // }),
    // SelectX({
    //   name: 'impuesto_id',
    //   label: 'Impuesto Id',
    //   placeholder: 'Seleccionar...',
    //   options: options.impuestosOptions ?? [],
    //   defaultValue: initialData?.impuesto_id != null ? String(initialData.impuesto_id) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Impuesto Id es obligatorio' },
    //     ],
    //   },
    // }),
    // InputX({
    //   name: 'tiempo_preparacion',
    //   label: 'Tiempo Preparacion',
    //   placeholder: 'Ingrese tiempo preparacion',
    //   type: 'number',
    //   defaultValue: initialData?.tiempo_preparacion != null ? String(initialData.tiempo_preparacion) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Tiempo Preparacion es obligatorio' },
    //     ],
    //     restrictions: [{ type: 'onlyNumbers' }],
    //   },
    // }),
    ...(() => {
      const elements: HTMLElement[] = [];

      // Preview de imagen actual (solo en edición)
      if (initialData?.imagen) {
        const previewWrapper = document.createElement('div');
        previewWrapper.style.cssText = 'margin-bottom:4px;';

        const previewLabel = document.createElement('p');
        previewLabel.textContent = 'Imagen actual';
        previewLabel.style.cssText = 'margin:0 0 6px;font-size:13px;font-weight:500;color:#374151;';

        const previewImg = document.createElement('img');
        previewImg.src = initialData.imagen;
        previewImg.alt = 'Imagen actual';
        previewImg.style.cssText =
          'width:160px;height:160px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;padding:8px;background:#fff;display:block;';

        const previewHint = document.createElement('p');
        previewHint.textContent = 'Selecciona un archivo para reemplazarla.';
        previewHint.style.cssText = 'margin:6px 0 0;font-size:12px;color:#6b7280;';

        previewWrapper.appendChild(previewLabel);
        previewWrapper.appendChild(previewImg);
        previewWrapper.appendChild(previewHint);
        elements.push(previewWrapper);
      }

      elements.push(
        InputFileX({
          name: 'imagen',
          label: initialData?.imagen ? 'Reemplazar imagen' : 'Imagen',
          accept: 'image/*',
          multiple: false,
          maxSize: 2 * 1024 * 1024,
        }),
      );

      return elements;
    })(),
  ];
}

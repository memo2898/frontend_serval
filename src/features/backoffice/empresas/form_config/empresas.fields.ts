import { InputX } from "@/lib/uiX/components/InputX";
import { SelectX } from "@/lib/uiX/components/SelectX";
import type { Empresas } from "../empresas.types";
import { InputFileX } from "@/lib/uiX";

export function getEmpresasFields(
  initialData: Empresas | null,
  options: {
    tipoDocumentosOptions: Array<{ value: number; label: string }>;
  },
): HTMLElement[] {
  return [
    InputX({
      name: "nombre",
      label: "Nombre",
      placeholder: "Ingrese nombre",
      type: "text",
      defaultValue:
        initialData?.nombre != null ? String(initialData.nombre) : "",
      rules: {
        validations: [
          { type: "required", message: "Nombre es obligatorio" },
          { type: "maxLength", value: 255 },
        ],
      },
    }),
    SelectX({
      name: "tipo_documento_id",
      label: "Tipo Documento Id",
      placeholder: "Seleccionar...",
      options: options.tipoDocumentosOptions ?? [],
      defaultValue:
        initialData?.tipo_documento_id != null
          ? String(initialData.tipo_documento_id)
          : "",
      rules: {
        validations: [
          { type: "required", message: "Tipo Documento Id es obligatorio" },
        ],
      },
    }),
    InputX({
      name: "numero_documento",
      label: "Numero Documento",
      placeholder: "Ingrese numero documento",
      type: "text",
      defaultValue:
        initialData?.numero_documento != null
          ? String(initialData.numero_documento)
          : "",
      rules: {
        validations: [
          { type: "required", message: "Numero Documento es obligatorio" },
          { type: "maxLength", value: 255 },
        ],
      },
    }),
    ...((): HTMLElement[] => {
      const elements: HTMLElement[] = [];

      // Preview de logo actual (solo en edición)
      if (initialData?.logo) {
        const previewWrapper = document.createElement('div');
        previewWrapper.style.cssText = 'margin-bottom:4px;';

        const previewLabel = document.createElement('p');
        previewLabel.textContent = 'Logo actual';
        previewLabel.style.cssText = 'margin:0 0 6px;font-size:13px;font-weight:500;color:#374151;';

        const previewImg = document.createElement('img');
        previewImg.src = initialData.logo;
        previewImg.alt = 'Logo actual';
        previewImg.style.cssText =
          'width:80px;height:80px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;padding:6px;background:#fff;display:block;';

        const previewHint = document.createElement('p');
        previewHint.textContent = 'Selecciona un archivo para reemplazarlo.';
        previewHint.style.cssText = 'margin:6px 0 0;font-size:12px;color:#6b7280;';

        previewWrapper.appendChild(previewLabel);
        previewWrapper.appendChild(previewImg);
        previewWrapper.appendChild(previewHint);
        elements.push(previewWrapper);
      }

      elements.push(
        InputFileX({
          name: 'logo',
          label: initialData?.logo ? 'Reemplazar logo' : 'Logo',
          accept: 'image/*',
          multiple: false,
          maxSize: 2 * 1024 * 1024,
        }),
      );

      return elements;
    })(),
  ];
}

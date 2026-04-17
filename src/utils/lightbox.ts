// ============================================
// Lightbox — visor de imágenes con navegación y filmstrip
// ============================================

export interface LightboxImage {
  url: string;
  nombre?: string;
  formato?: string;
  size?: number;
}

export function openLightbox(images: LightboxImage[], startIndex: number = 0): void {
  let current = startIndex;

  // ---- Estilos ----
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lb-fade-in { from { opacity:0 } to { opacity:1 } }
    @keyframes lb-img-in  { from { opacity:0; transform:scale(.97) } to { opacity:1; transform:scale(1) } }

    .lb-btn {
      background:rgba(255,255,255,.12);border:none;color:#fff;
      width:44px;height:44px;border-radius:50%;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      transition:background .15s;
    }
    .lb-btn:hover  { background:rgba(255,255,255,.25); }
    .lb-btn:disabled { opacity:.2;cursor:default;pointer-events:none; }

    .lb-thumb {
      width:64px;height:64px;object-fit:cover;border-radius:6px;cursor:pointer;
      border:2px solid transparent;flex-shrink:0;
      opacity:.55;transition:opacity .15s,border-color .15s,transform .15s;
    }
    .lb-thumb:hover  { opacity:.85; transform:scale(1.05); }
    .lb-thumb-active { border-color:#fff !important;opacity:1 !important; transform:scale(1.05); }

    .lb-strip {
      display:flex;gap:8px;overflow-x:auto;padding:8px 16px;
      scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;
      max-width:90vw;
    }
    .lb-strip::-webkit-scrollbar { height:4px; }
    .lb-strip::-webkit-scrollbar-thumb { background:rgba(255,255,255,.2);border-radius:2px; }
  `;
  document.head.appendChild(style);

  // ---- Overlay ----
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,.92);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    animation:lb-fade-in .15s ease;
  `;

  // ---- Barra superior ----
  const topBar = document.createElement('div');
  topBar.style.cssText = `
    position:absolute;top:0;left:0;right:0;
    display:flex;justify-content:space-between;align-items:center;
    padding:14px 20px;
  `;

  const counter = document.createElement('span');
  counter.style.cssText = 'color:rgba(255,255,255,.55);font-size:13px;font-family:system-ui,sans-serif';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lb-btn';
  closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`;
  closeBtn.addEventListener('click', close);

  topBar.appendChild(counter);
  topBar.appendChild(closeBtn);

  // ---- Área central (prev + img + next) ----
  const center = document.createElement('div');
  center.style.cssText = 'display:flex;align-items:center;gap:12px;width:100%;max-width:92vw;padding:0 8px';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lb-btn';
  prevBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>`;
  prevBtn.addEventListener('click', () => navigate(-1));

  const imgWrapper = document.createElement('div');
  imgWrapper.style.cssText = 'flex:1;display:flex;justify-content:center;align-items:center;overflow:hidden';

  const imgEl = document.createElement('img');
  imgEl.style.cssText = 'max-height:65vh;max-width:100%;object-fit:contain;border-radius:6px;animation:lb-img-in .2s ease;';

  imgWrapper.appendChild(imgEl);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lb-btn';
  nextBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>`;
  nextBtn.addEventListener('click', () => navigate(1));

  center.appendChild(prevBtn);
  center.appendChild(imgWrapper);
  center.appendChild(nextBtn);

  // ---- Info (nombre + meta) ----
  const infoBar = document.createElement('div');
  infoBar.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:12px;min-height:36px';

  const imgName = document.createElement('p');
  imgName.style.cssText = 'margin:0;color:#fff;font-size:13px;font-weight:500;font-family:system-ui,sans-serif;text-align:center;max-width:80vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';

  const imgMeta = document.createElement('p');
  imgMeta.style.cssText = 'margin:0;color:rgba(255,255,255,.4);font-size:11px;font-family:system-ui,sans-serif';

  infoBar.appendChild(imgName);
  infoBar.appendChild(imgMeta);

  // ---- Filmstrip ----
  const strip = document.createElement('div');
  strip.className = 'lb-strip';

  const thumbEls: HTMLImageElement[] = images.map((img, i) => {
    const th = document.createElement('img');
    th.className = 'lb-thumb';
    th.src = img.url;
    th.alt = img.nombre ?? '';
    th.addEventListener('click', () => {
      current = i;
      render();
    });
    strip.appendChild(th);
    return th;
  });

  // ---- Bottom wrapper ----
  const bottom = document.createElement('div');
  bottom.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:10px';
  bottom.appendChild(infoBar);
  bottom.appendChild(strip);

  // ---- Ensamblar ----
  overlay.appendChild(topBar);
  overlay.appendChild(center);
  overlay.appendChild(bottom);
  document.body.appendChild(overlay);

  // ---- Cerrar al click en fondo ----
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ---- Teclado ----
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   navigate(-1);
    if (e.key === 'ArrowRight')  navigate(1);
  };
  document.addEventListener('keydown', onKey);

  // ---- Lógica ----

  function render(): void {
    const img = images[current];

    imgEl.src = img.url;
    imgEl.alt = img.nombre ?? '';
    imgEl.style.animation = 'none';
    requestAnimationFrame(() => { imgEl.style.animation = 'lb-img-in .2s ease'; });

    counter.textContent = `${current + 1} / ${images.length}`;
    imgName.textContent = img.nombre ?? '';
    const kb = img.size ? (img.size / 1024).toFixed(1) + ' KB' : '';
    imgMeta.textContent = [img.formato?.toUpperCase(), kb].filter(Boolean).join(' · ');

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === images.length - 1;

    // Actualizar thumbnails
    thumbEls.forEach((th, i) => {
      th.classList.toggle('lb-thumb-active', i === current);
    });

    // Scroll del filmstrip al thumbnail activo
    const activeTh = thumbEls[current];
    if (activeTh) {
      activeTh.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function navigate(dir: -1 | 1): void {
    const next = current + dir;
    if (next < 0 || next >= images.length) return;
    current = next;
    render();
  }

  function close(): void {
    document.removeEventListener('keydown', onKey);
    style.remove();
    overlay.remove();
  }

  render();
}

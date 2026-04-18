import { defineConfig, type ViteDevServer } from "vite";
import { resolve } from "path";
import fs from "fs";

// ============================================
// RUTAS AMIGABLES — generadas automáticamente
// ============================================
const URL_MAPPINGS: Record<string, string> = {
  "/": "/index.html",
  "/login": "/src/features/client/login/login.html",
  "/lobby": "/src/features/client/lobby/lobby.html",
  "/dashboard": "/src/features/backoffice/dashboard/index.html",
  "/mi-perfil": "/src/features/backoffice/mi-perfil/index.html",
  "/tipodocumentos": "/src/features/backoffice/tipodocumentos/index.html",
  "/empresas": "/src/features/backoffice/empresas/index.html",
  "/sucursales": "/src/features/backoffice/sucursales/index.html",
  "/terminales": "/src/features/backoffice/terminales/index.html",
  "/roles": "/src/features/backoffice/roles/index.html",
  "/permisos": "/src/features/backoffice/permisos/index.html",
  "/rolpermiso": "/src/features/backoffice/rolpermiso/index.html",
  "/usuarios": "/src/features/backoffice/usuarios/index.html",
  "/paises": "/src/features/backoffice/paises/index.html",
  "/impuestos": "/src/features/backoffice/impuestos/index.html",
  "/familias": "/src/features/backoffice/familias/index.html",
  "/subfamilias": "/src/features/backoffice/subfamilias/index.html",
  "/articulos": "/src/features/backoffice/articulos/index.html",
  "/articuloimpuestos": "/src/features/backoffice/articuloimpuestos/index.html",
  "/tarifas": "/src/features/backoffice/tarifas/index.html",
  "/preciosportarifa": "/src/features/backoffice/preciosportarifa/index.html",
  "/alergenos": "/src/features/backoffice/alergenos/index.html",
  "/articuloalergenos": "/src/features/backoffice/articuloalergenos/index.html",
  "/gruposmodificadores":
    "/src/features/backoffice/gruposmodificadores/index.html",
  "/modificadores": "/src/features/backoffice/modificadores/index.html",
  "/articulogruposmodificadores":
    "/src/features/backoffice/articulogruposmodificadores/index.html",
  "/combos": "/src/features/backoffice/combos/index.html",
  "/comboarticulos": "/src/features/backoffice/comboarticulos/index.html",
  "/zonas": "/src/features/backoffice/zonas/index.html",
  "/mesas": "/src/features/backoffice/mesas/index.html",
  "/clientes": "/src/features/backoffice/clientes/index.html",
  "/formaspago": "/src/features/backoffice/formaspago/index.html",
  "/descuentos": "/src/features/backoffice/descuentos/index.html",
  "/turnoscaja": "/src/features/backoffice/turnoscaja/index.html",
  "/movimientoscaja": "/src/features/backoffice/movimientoscaja/index.html",
  "/ordenes": "/src/features/backoffice/ordenes/index.html",
  "/ordenlineas": "/src/features/backoffice/ordenlineas/index.html",
  "/ordenlineamodificadores":
    "/src/features/backoffice/ordenlineamodificadores/index.html",
  "/ordenpagos": "/src/features/backoffice/ordenpagos/index.html",
  "/facturas": "/src/features/backoffice/facturas/index.html",
  "/destinosimpresion": "/src/features/backoffice/destinosimpresion/index.html",
  "/kdsordenes": "/src/features/backoffice/kdsordenes/index.html",
  "/stock": "/src/features/backoffice/stock/index.html",
  "/movimientosstock": "/src/features/backoffice/movimientosstock/index.html",
  "/configuracionsucursal":
    "/src/features/backoffice/configuracionsucursal/index.html",
  "/auth": "/src/features/backoffice/auth/index.html",
  "/uploads": "/src/features/backoffice/uploads/index.html",
  "/mail": "/src/features/backoffice/mail/index.html",
  "/utils": "/src/features/backoffice/utils/index.html",
    '/monedas': '/src/features/backoffice/monedas/index.html',
      '/usuariorol': '/src/features/backoffice/usuariorol/index.html',
        '/reservaciones': '/src/features/backoffice/reservaciones/index.html',
  '/sucursalimpuestos': '/src/features/backoffice/sucursalimpuestos/index.html',
  '/reportes': '/src/features/backoffice/reportes/index.html',
  "/404": "/src/features/404/index.html",
  // ── POS / Client modules ──────────────────────────────────────────────────
  "/pos/mesas": "/src/features/client/mesas/mesas.html",
  "/pos/reservaciones": "/src/features/client/reservaciones/reservaciones.html",
  "/pos/caja": "/src/features/client/caja/caja.html",
  "/pos/cocina": "/src/features/client/cocina/cocina.html",
  "/pos/barra": "/src/features/client/barra/barra.html",
};

// ============================================
// BASE PATH
// ============================================
const BASE_PATH = "/";

// ============================================
// PLUGIN: Reescribe rutas relativas a absolutas
// ============================================
function htmlPathRewriter() {
  return {
    name: "html-path-rewriter",
    transformIndexHtml: {
      order: "pre" as const,
      handler(html: string, ctx: { filename: string }) {
        const filePath = ctx.filename;
        const projectRoot = process.cwd().replace(/\\/g, "/");

        let fileDir = filePath.replace(projectRoot, "").replace(/\\/g, "/");
        fileDir = fileDir.substring(0, fileDir.lastIndexOf("/"));

        const resolveRelativePath = (path: string): string => {
          if (
            path.startsWith("/") ||
            path.startsWith("http") ||
            path.startsWith("data:")
          ) {
            return path;
          }
          let absolutePath = path;
          if (path.startsWith("./")) {
            absolutePath =
              fileDir === "" || fileDir === "/"
                ? "/" + path.substring(2)
                : fileDir + "/" + path.substring(2);
          } else if (path.startsWith("../")) {
            let dirParts = fileDir.split("/").filter(Boolean);
            const pathParts = path.split("/");
            for (const part of pathParts) {
              if (part === "..") dirParts.pop();
              else if (part !== ".") dirParts.push(part);
            }
            absolutePath = "/" + dirParts.join("/");
          } else {
            absolutePath =
              fileDir === "" || fileDir === "/"
                ? "/" + path
                : fileDir + "/" + path;
          }
          return absolutePath.replace(/\/+/g, "/");
        };

        html = html.replace(
          /(<link[^>]+href=)(["'])([^"']+)\2/gi,
          (_, prefix, quote, path) =>
            `${prefix}${quote}${resolveRelativePath(path)}${quote}`,
        );
        html = html.replace(
          /(<script[^>]+src=)(["'])([^"']+)\2/gi,
          (_, prefix, quote, path) =>
            `${prefix}${quote}${resolveRelativePath(path)}${quote}`,
        );
        html = html.replace(
          /(<img[^>]+src=)(["'])([^"']+)\2/gi,
          (_, prefix, quote, path) =>
            `${prefix}${quote}${resolveRelativePath(path)}${quote}`,
        );

        return html;
      },
    },
  };
}

// ============================================
// PLUGIN: Middleware para rutas amigables en DEV
// ============================================
function friendlyRoutes() {
  return {
    name: "friendly-routes",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (URL_MAPPINGS[url]) {
          req.url = URL_MAPPINGS[url];
          return next();
        }
        // Si no es una ruta conocida y tampoco parece un asset, redirigir a /404
        const isAsset =
          url.includes(".") ||
          url.startsWith("/@") ||
          url.startsWith("/node_modules");
        if (!isAsset) {
          req.url = URL_MAPPINGS["/404"];
          return next();
        }
        next();
      });
    },
  };
}

// ============================================
// PLUGIN: Generar .htaccess — SOLO en build
// ============================================
function generateHtaccess() {
  return {
    name: "generate-htaccess",
    closeBundle() {
      const rewriteBase = BASE_PATH.endsWith("/") ? BASE_PATH : BASE_PATH + "/";
      const htaccessContent = `# Generado automáticamente por Vite
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${rewriteBase}
${Object.entries(URL_MAPPINGS)
  .map(([friendly, real]) => {
    const cleanFriendly = friendly.substring(1);
    const escapedFriendly = cleanFriendly.replace(/[._]/g, "\\$&");
    const cleanReal = real.substring(1);
    return `  RewriteRule ^${escapedFriendly}$ ${cleanReal} [L,NE]`;
  })
  .join("\n")}

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ src/features/404/index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>`;

      const distDir = resolve(__dirname, "dist");
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
      fs.writeFileSync(resolve(distDir, ".htaccess"), htaccessContent);
      console.log("✅ .htaccess generado en dist/.htaccess");
    },
  };
}

// ============================================
// CONFIGURACIÓN DE VITE
// ============================================
export default defineConfig({
  base: BASE_PATH,
  

  plugins: [htmlPathRewriter(), friendlyRoutes(), generateHtaccess()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    allowedHosts: ['app.chuys.tech']
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      input: Object.fromEntries(
        Object.values(URL_MAPPINGS).map((path) => [
          path.replace(/[\/\.]/g, "_"),
          resolve(__dirname, path.substring(1)),
        ]),
      ),
    },
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});

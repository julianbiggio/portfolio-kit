# portfolio-kit

Template de **link-in-bio + CV interactivo** — **HTML estático, sin build, sin backend**, servido desde el edge de **Cloudflare Pages**. Hacelo tuyo editando, sobre todo, un único archivo de configuración (`config.js`).

🔗 **Demo en vivo / Live demo:** https://portfolio.biggio.com.ar

🌐 **Idioma / Language:** [Español](#español) · [English](#english)

---

# Español

**Contenidos**

1. [🧱 Arquitectura](#1--arquitectura)
2. [🎨 Diseño](#2--diseño)
3. [📁 Estructura del repo](#3--estructura-del-repo)
4. [✨ Características](#4--características)
5. [🧬 Hacé tu propia versión](#5--hacé-tu-propia-versión)
6. [🔧 Configuración (config.js)](#6--configuración-configjs)
7. [🚀 Deploy](#7--deploy)
8. [📊 Analytics (opcional)](#8--analytics-opcional)
9. [🔎 SEO e indexación](#9--seo-e-indexación)
10. [📌 Notas](#10--notas)
11. [🤖 Guía para una IA](#11--guía-para-una-ia)
12. [📄 Licencia](#12--licencia)

## 1. 🧱 Arquitectura

**100% estático**: sin servidor de aplicación, base de datos ni build. Son archivos `.html` / `.pdf` que Cloudflare sirve desde su CDN global (edge), con latencia mínima y nada que mantener "prendido".

```
   Vos editás                GitHub                    Cloudflare Pages              Visitante
  ┌──────────┐   git push   ┌──────────┐  webhook    ┌────────────────────┐  HTTPS  ┌──────────┐
  │  código  │ ───────────► │   main   │ ──────────► │  build (ninguno) +  │ ──────► │ navegador│
  │  (local) │              │  (repo)  │             │  deploy al edge/CDN │         │          │
  └──────────┘              └──────────┘             └────────────────────┘         └──────────┘
                                                          tu-dominio.com
```

**Flujo de deploy:** `git push` a `main` → un webhook de Cloudflare Pages dispara el deploy (CI/CD nativo, **sin GitHub Actions**) → como no hay build (`Build command` vacío, output `/`), publica los archivos tal cual → en **~1 min** está vivo. Cada commit a `main` = un deploy.

**Decisiones de arquitectura:**

- **Sin backend → sin superficie de ataque ni costos de servidor.** No hay secretos en el repo. La única lógica de servidor es un middleware mínimo (`functions/_middleware.js`) que oculta archivos de documentación.
- **Edge/CDN** → rápido y resiliente por defecto.
- **El repo es la única fuente de verdad:** lo que está en `main` es lo que ve el visitante.
- **Toda la lógica vive en el cliente** (idioma, tema, QR, vCard) con JS vanilla, sin frameworks.

**Componentes:**

| Pieza | Rol |
|---|---|
| `config.js` | **Identidad centralizada** (nombre, iniciales, rol, ancla, mail, links, `siteUrl`, vCard, saludo). La leen landing y CV y la aplican al DOM. Editar este archivo = cambiar todo el sitio. |
| `index.html` | Landing (link-in-bio): foto, nombre, rol, ancla, mini-chat, botones, QR, vCard. Lógica de idioma/tema en `<script>` inline. |
| `CV-interactivo.html` | CV renderizado por JS desde un objeto `DATA` embebido (ES/EN). Lee `?lang=` de la URL. |
| `img/photo.jpg` | Foto compartida por landing y CV. Externa (no base64) → HTML liviano y cacheable. |
| `img/og-photo.jpg` | Imagen 1200×630 para el preview al compartir (Open Graph). |
| `icons/` | Favicon e íconos (`favicon.svg/.ico`, `favicon-16/32.png`, `apple-touch-icon.png`). |
| `lib/qrcode.min.js` | Librería del QR (qrcodejs 1.0.0), local, sin CDN. |
| `cv/cv-es.pdf` / `cv/cv-en.pdf` | CV descargable; el landing sirve uno u otro según idioma. |
| `tools/gen_icons.py`, `tools/gen_og.py` | Generadores (Python/Pillow) de `icons/` e `img/og-photo.jpg`. Solo dev — bloqueados del sitio público. |
| `_headers` | Headers de seguridad aplicados por Cloudflare (ver abajo). |
| `robots.txt` | Rastreo: `Allow: /`, `Disallow: /cv/` y puntero al `sitemap.xml`. |
| `sitemap.xml` | Mapa del sitio (landing + CV). |
| `functions/_middleware.js` | Middleware de edge: devuelve `404` para lo no-público (`README.md`, `.gitignore`, `/test/`, `/.claude/`, `/tools/`). |
| `test/checks.mjs` | Smoke tests sin dependencias (Node). Corren al iniciar sesión vía hook de `.claude/`. |

**Seguridad (vía `_headers`):** `X-Frame-Options: SAMEORIGIN` (anti-clickjacking) · `X-Content-Type-Options: nosniff` · `Referrer-Policy: no-referrer` · `Permissions-Policy` (bloquea cámara/micrófono/geolocalización).

> El sitio es **público e indexable** (ver [🔎 SEO e indexación](#9--seo-e-indexación)). Ser indexable no cambia la postura de seguridad: el contenido siempre fue público; ahora además aparece en buscadores.

---

## 2. 🎨 Diseño

Diseño propio, sin framework de CSS — todo el sistema visual está inline en cada HTML.

- **Tipografía:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) (texto) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) (datos/fechas), desde Google Fonts.
- **Color de acento:** azul `#2e44c9`, centralizado en variables CSS (`--blue`, `--name`, `--accent`…) → un cambio repinta todo.
- **Tema claro/oscuro:** se togglea con `data-theme` en `<html>`; cada tema redefine las variables. El botón ☀️/🌙 aplica al instante.

**`index.html`:** tarjeta centrada con foto, nombre, rol y botones (LinkedIn · CV · Referencias) con íconos SVG inline; **chip flotante** de foto+nombre al scrollear; **i18n por atributos** `data-es`/`data-en`; **QR + vCard** generados en el cliente.

**`CV-interactivo.html`:** layout "hoja A4" con **grid CSS** (header oscuro, sidebar y columna de experiencia); **render por datos** desde el objeto `DATA` (ES/EN) → una fuente, dos idiomas; abre en el idioma de la landing vía `?lang=`; **responsive** (colapsa a una columna en `max-width:680px`).

---

## 3. 📁 Estructura del repo

Archivos **agrupados por tipo** (`img/`, `icons/`, `cv/`, `lib/`). En la raíz, solo lo que **debe** estar ahí: las páginas, `config.js` y lo que Cloudflare lee de la raíz (`_headers`, `robots.txt`, `sitemap.xml`, `functions/`).

```
.
├── index.html              # Landing (link-in-bio)
├── CV-interactivo.html     # CV interactivo (render por JS, ES/EN)
├── config.js               # ★ Identidad centralizada — la leen landing + CV
├── img/                    # photo.jpg (compartida) · og-photo.jpg (preview 1200×630)
├── icons/                  # favicon.svg/.ico · favicon-16/32.png · apple-touch-icon.png
├── cv/                     # cv-es.pdf · cv-en.pdf (CV descargable)
├── lib/                    # qrcode.min.js (local, sin CDN)
├── robots.txt              # Reglas de rastreo + sitemap (SEO)
├── sitemap.xml             # Mapa del sitio (landing + CV)
├── _headers                # Headers de seguridad
├── functions/_middleware.js # Oculta docs/tooling del sitio público
├── tools/                  # gen_icons.py · gen_og.py (generadores, solo dev)
├── test/checks.mjs         # Smoke tests (Node, sin dependencias)
├── .claude/                # settings.json + hooks/session-start.sh
├── LICENSE                 # Licencia MIT
├── .gitignore
└── README.md
```

---

## 4. ✨ Características

- Switch de idioma ES / EN (landing y CV, con continuidad vía `?lang=`)
- Tema claro / oscuro (☀️ / 🌙)
- Botones: LinkedIn · CV interactivo · Referencias
- Descarga de CV en PDF según idioma
- QR + vCard generados en el cliente
- Chip flotante de nombre/foto al scrollear
- Meta tags Open Graph / canonical para previews
- **SEO:** indexable, con `sitemap.xml` y `/cv/` excluido de los resultados

---

## 5. 🧬 Hacé tu propia versión

El contenido personal está **centralizado** para editar pocos lugares:

1. **`config.js`** — tu identidad: nombre, iniciales, rol (ES/EN), ancla, mail, links, `siteUrl`, título de vCard y saludo. Editarlo actualiza landing y CV.
2. **Objeto `DATA` en `CV-interactivo.html`** — el contenido del CV (resumen, experiencia, skills, educación, idiomas, certificaciones) en ES e inglés.
3. **Foto** `img/photo.jpg` (cuadrada, ~800×800) — la usan landing y CV. La que viene es solo un placeholder de ejemplo: reemplazala por la tuya.

Las 4 cosas que **no** leen `config.js` (son estáticas, las leen crawlers/navegador) y se editan a mano:

4. **`<head>`** de cada HTML: `<title>`, `<link rel="canonical">` y metas `og:*` / `twitter:*`. Están agrupadas y comentadas.
5. **Favicon:** `python3 tools/gen_icons.py` — usa `initials` de `config.js` y el color de `index.html` para regenerar `icons/`.
6. **Imagen de compartir** `img/og-photo.jpg`: `python3 tools/gen_og.py` — centra `img/photo.jpg` sobre un fondo tomado del borde. Los **PDFs** `cv/*.pdf` se reemplazan a mano.
7. **Dominio:** configurá `tu-dominio.com` en Cloudflare Pages y actualizá `siteUrl` en `config.js` + las URLs absolutas estáticas (`canonical`, `og:url`/`og:image`, `sitemap.xml` y la línea `Sitemap:` de `robots.txt`).

> Los scripts de `tools/` necesitan Python con Pillow (`pip install pillow`). Al terminar: `node test/checks.mjs` y `git push`.

---

## 6. 🔧 Configuración (config.js)

| Campo | Para qué |
|---|---|
| `firstName` / `lastName` / `initials` | Nombre mostrado + iniciales del favicon/título |
| `roleES` / `roleEN` | Subtítulo del landing (bilingüe) |
| `anchorES` / `anchorEN` | Chip cuantitativo bajo el nombre (vacío = oculto) |
| `email` / `linkedin` / `featured` | Contacto y links de los botones |
| `siteUrl` | QR + compartir |
| `vcardTitle` | Puesto que se guarda en la vCard |
| `chatGreetES` / `chatGreetEN` | Saludo del mini-chat |
| `fileBase` | Nombre del PDF al descargar (`<fileBase>-ES.pdf`) |

---

## 7. 🚀 Deploy

Cloudflare Pages + GitHub, CI/CD nativo: cada `git push` a `main` redespliega solo.

**1. Subir el repo (una vez):**

```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/portfolio.git
git push -u origin main
```

**2. Conectar Cloudflare Pages:** Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → elegí el repo. Build config: **Framework preset** `None`, **Build command** *(vacío)*, **Output** `/` → **Save and Deploy**.

**3. Dominio propio:** Pages → tu proyecto → **Custom domains** → agregar `tu-dominio.com`. Cloudflare crea DNS + HTTPS automáticamente.

**Ciclo de trabajo:** editás → `git add . && git commit -m "update: ..." && git push` → redeploy en ~1 min.

---

## 8. 📊 Analytics (opcional)

- **Visitas:** Cloudflare Dashboard → tu proyecto → **Web Analytics** → activar. Cero código, sin cookies.
- **Click-tracking por botón:** ya cableado en `index.html` (elementos `data-track`); por defecto loguea a consola. Para enviarlo a un servicio, seguí las instrucciones comentadas en el `<script>`.

---

## 9. 🔎 SEO e indexación

El sitio es **público e indexable** — pensado para promocionarse y aparecer en buscadores.

- **`robots.txt`**: `Allow: /` + puntero al sitemap. El único bloqueo es `Disallow: /cv/`: los PDFs no deben aparecer como resultados sueltos en Google; la puerta de entrada es la página.
- **`sitemap.xml`** (raíz): lista las dos páginas indexables —landing (`/`) y CV (`/CV-interactivo.html`)— con `<lastmod>`. Si agregás páginas, sumalas acá.
- **Canonical:** cada HTML declara su URL canónica con `<link rel="canonical">`, para evitar contenido duplicado.
- **`_headers`** solo trae headers de seguridad (sin `X-Robots-Tag`).

> El template viene **indexable** por defecto. Si querés mantenerlo fuera de buscadores (por ejemplo mientras lo armás), poné `Disallow: /` en `robots.txt` y/o agregá `<meta name="robots" content="noindex">` en el `<head>` de cada HTML.

---

## 10. 📌 Notas

- El sitio es **público e indexable** (ver [🔎 SEO e indexación](#9--seo-e-indexación)). Esto no lo hace más o menos privado: el contenido siempre fue accesible con el link. Para privacidad real: Cloudflare Access (gratis hasta 50 usuarios).
- 100% estático: sin backend, base de datos ni secretos. No subir credenciales al repo.

---

## 11. 🤖 Guía para una IA

Convenciones y flujo del proyecto, para que una IA retome ediciones sin contexto previo. Es tooling interno; se mantiene **solo en español**.

### 🌿 Rama de trabajo

- **`main`** → producción (`tu-dominio.com`); cada push redeploya en ~1 min.
- **`dev`** (o cualquier feature branch) → preview en `<rama>.<tu-proyecto>.pages.dev` (Cloudflare genera una URL por rama).
- Flujo: editar en `dev` → PR a `main` → **merge commit (no squash)** → redeploy.

> **Squash-merge:** si se hace squash de una rama divergida, el diff puede no aplicar cambios ya presentes en ambas ramas. Usar siempre merge commit para dev→main.

### 🌈 Colores

Todos en variables CSS dentro de cada HTML (no hay `.css` externo).

| Variable | Tema claro | Tema oscuro |
|---|---|---|
| `--blue` / `--accent` | `#2e44c9` | `#5e76ff` |
| `--blue-hover` | `#2336a8` | `#6079ff` |
| `--name` | `#2e44c9` | `#5e76ff` |

Para cambiar el acento: `:root { --blue:... }` en `index.html` y `:root { --accent:... }` en `CV-interactivo.html`.

### 🌓 Tema e idioma (detección + persistencia)

Regla: **la elección del usuario gana; si no eligió, se usa el dispositivo; solo se persiste al elegir a mano.**

- **Tema** (`data-theme="dark"`): un `<script>` inline en `<head>` (antes de pintar, evita flash) resuelve `localStorage.theme` → si no, `matchMedia('(prefers-color-scheme: dark)')`. Solo guarda al tocar ☀️/🌙.
- **Idioma** (`data-lang`, textos `data-es`/`data-en`): prioridad en el CV `?lang=` → `localStorage.lang` → dispositivo → default; en el landing sin `?lang=`. Español solo si el dispositivo prefiere español; inglés para el resto. `setLang(lang, persist)` solo guarda si `persist !== false` (en la carga se llama con `false`).
- **Migración `prefv`:** una versión vieja persistía `theme`/`lang` en cada carga. Al inicio del `<script>` hay una migración de una vez: si `localStorage.prefv !== '2'`, borra `theme`/`lang` legacy y setea `prefv='2'`. Si cambiás los defaults, **subí el número de versión**. Claves: `theme`, `lang`, `prefv`.

### 🪪 Identidad centralizada (`config.js`)

Toda la identidad vive en `config.js` (`window.SITE = {…}`). Ambas páginas la cargan con `<script src>` **antes** de su script principal:

- **`index.html`:** `applyIdentity()` setea nombre, `data-es/en` del rol/ancla y los `href` de los botones. El saludo del chat, `navigator.share`, la vCard y el nombre del PDF también leen de `window.SITE`.
- **`CV-interactivo.html`:** `render()` usa `const S = window.SITE` para nombre, foto (alt), mail y LinkedIn del bloque de contacto, el chip y el PDF.

**Regla:** datos personales nuevos → `config.js`, nunca hardcodeados. Lo único estático (lo leen crawlers/navegador): `<title>`, `<link rel="canonical">`, metas `og:*`/`twitter:*` y los favicon — marcados con un comentario `TEMPLATE:` en cada `<head>`.

### 🌐 i18n

- **`index.html`:** cada elemento traducible lleva `data-es`/`data-en`; `setLang(lang, persist)` recorre el DOM, ajusta el botón ES/EN, el link al CV (`?lang=`) y el modal.
- **`CV-interactivo.html`:** todo el contenido está en el objeto `DATA` (claves `es`/`en`); `render()` genera el HTML según `lang`. Para editar el CV, tocar `DATA` directamente.
- **Mini-chat:** preguntas/respuestas en el objeto `CHAT` (`es`/`en`, array `chips` con `{q, a}`). Es conversacional, no un volcado del CV.

### 💅 CSS

Inline en `<style>` del `<head>`, por secciones comentadas: (1) variables, (2) reset/base, (3) componentes, (4) responsive, (5) animaciones, (6) print. No crear `.css` externos — el proyecto es monolítico a propósito.

### 📄 PDFs descargables (`cv/cv-es.pdf` / `cv/cv-en.pdf`)

Se generan con Puppeteer (Node + Chromium headless) desde `CV-interactivo.html`. El script está en `/tmp/gen_pdf.js` (no versionado):

```bash
npm install puppeteer      # una vez
node /tmp/gen_pdf.js        # genera ambos PDFs
```

Inyecta `?lang=es|en` y genera A4 sin márgenes; el CSS `@media print` ya encaja todo en una página. Si cambia el CV, regenerar y commitear los PDFs.

### ⚡ Performance y assets (no romper — el smoke test lo verifica)

- **Foto externa, NO base64 inline.** `img/photo.jpg` la usan landing y CV; embeberla en base64 infla el HTML. El `<img>` del hero lleva `width`/`height` y `.hero img` **debe** tener `height:auto` (si no, se estira).
- **QR:** `lib/qrcode.min.js` local, sin CDN.
- **Fuentes (solo CV):** DM Sans/Mono con `display=swap` + `preconnect`. El landing usa fuentes del sistema.
- **Open Graph:** `img/og-photo.jpg` (1200×630) vía `python3 tools/gen_og.py`. Si cambia, **renombrar el archivo** y actualizar las metas → rompe la caché de WhatsApp/redes (cachean por URL); compartir `…/?v=N` también fuerza el re-fetch.
- **vCard:** se arma en el cliente con `config.js`; foto embebida reescalada a 320px; nombre sin acentos (`noAccent()`).
- **Favicon:** archivos reales en `icons/` vía `gen_icons.py`. Títulos `AD | Portfolio` / `AD | Curriculum`: estáticos en el `<head>`.
- **Mobile:** `body` usa `min-height:100dvh` (no `100vh`).

### 🔎 SEO (robots, sitemap, canonical)

Indexable. Tres lugares deben quedar consistentes (el smoke test los verifica): `robots.txt` (`Allow: /` + `Disallow: /cv/` + `Sitemap:`), `sitemap.xml` (sumar páginas nuevas) y `<link rel="canonical">` en cada HTML. Si cambia el dominio/páginas, actualizar todas las URLs absolutas.

### 🚫 Editar con criterio

- `robots.txt` / `sitemap.xml`: SEO (ver [🔎 SEO e indexación](#9--seo-e-indexación)). `Allow: /` habilita indexación; `Disallow: /cv/` mantiene los PDFs fuera de resultados.
- `_headers`: seguridad — no cambiar sin requisito específico.
- `functions/_middleware.js`: 404 para `README.md`, `.gitignore`, `/test/`, `/.claude/`, `/tools/`. Si agregás tooling, sumalo a `BLOCKED` (y su check en `test/checks.mjs`). **Excepciones** (no se bloquean): `config.js`, `robots.txt`, `sitemap.xml`.

### ✍️ Commits

`feat:` · `fix:` · `update:` · `style:` + descripción corta.

### ✅ Smoke tests

Suite sin dependencias (Node) que atrapa regresiones (foto en base64, hero estirado, refs a archivos borrados, detección de tema/idioma rota, JS inline inválido, assets inexistentes, mail hardcodeado, config de SEO):

```bash
node test/checks.mjs   # exit ≠ 0 si algo falla
```

Corre sola al iniciar sesión vía hook (`.claude/hooks/session-start.sh`). Al agregar un check, sumalo a `test/checks.mjs`.

### ☑️ Checklist antes de mergear a main

1. `node test/checks.mjs` pasa.
2. Preview de la rama OK.
3. Modo oscuro **y** claro.
4. Mobile (sobre todo iOS Safari).
5. Si cambió el CV, regenerar los PDFs.
6. Merge commit (no squash).

---

## 12. 📄 Licencia

Bajo licencia **MIT** — ver el archivo [LICENSE](LICENSE).

---

# English

**Contents**

1. [🧱 Architecture](#1--architecture)
2. [🎨 Design](#2--design)
3. [📁 Repository structure](#3--repository-structure)
4. [✨ Features](#4--features)
5. [🧬 Make it your own](#5--make-it-your-own)
6. [🔧 Configuration (config.js)](#6--configuration-configjs)
7. [🚀 Deployment](#7--deployment)
8. [📊 Analytics (optional)](#8--analytics-optional)
9. [🔎 SEO and indexing](#9--seo-and-indexing)
10. [📌 Notes](#10--notes)
11. [🤖 AI editing guide](#11--ai-editing-guide)
12. [📄 License](#12--license)

## 1. 🧱 Architecture

**100% static**: no application server, database, or build. Just `.html` / `.pdf` files Cloudflare serves from its global CDN (edge), with minimal latency and nothing to keep "running".

```
   You edit                  GitHub                    Cloudflare Pages              Visitor
  ┌──────────┐   git push   ┌──────────┐  webhook    ┌────────────────────┐  HTTPS  ┌──────────┐
  │   code   │ ───────────► │   main   │ ──────────► │  build (none) +     │ ──────► │ browser  │
  │  (local) │              │  (repo)  │             │  deploy to edge/CDN │         │          │
  └──────────┘              └──────────┘             └────────────────────┘         └──────────┘
                                                          your-domain.com
```

**Deploy flow:** `git push` to `main` → a Cloudflare Pages webhook triggers the deploy (native CI/CD, **no GitHub Actions**) → since there's no build (`Build command` empty, output `/`), it publishes the files as-is → live in **~1 min**. Every commit to `main` = one deploy.

**Architecture decisions:**

- **No backend → no attack surface or server costs.** No secrets in the repo. The only server-side logic is a minimal middleware (`functions/_middleware.js`) hiding documentation files.
- **Edge/CDN** → fast and resilient by default.
- **The repo is the single source of truth:** what's on `main` is what the visitor sees.
- **All logic lives in the client** (language, theme, QR, vCard) with vanilla JS, no frameworks.

**Components:**

| Piece | Role |
|---|---|
| `config.js` | **Centralized identity** (name, initials, role, anchor, email, links, `siteUrl`, vCard, greeting). Read by landing and CV and applied to the DOM. Editing it = changing the whole site. |
| `index.html` | Landing (link-in-bio): photo, name, role, anchor, mini-chat, buttons, QR, vCard. Language/theme logic in an inline `<script>`. |
| `CV-interactivo.html` | CV rendered by JS from an embedded `DATA` object (ES/EN). Reads `?lang=` from the URL. |
| `img/photo.jpg` | Photo shared by landing and CV. External (not base64) → light, cacheable HTML. |
| `img/og-photo.jpg` | 1200×630 image for the share preview (Open Graph). |
| `icons/` | Favicon and icons (`favicon.svg/.ico`, `favicon-16/32.png`, `apple-touch-icon.png`). |
| `lib/qrcode.min.js` | QR library (qrcodejs 1.0.0), local, no CDN. |
| `cv/cv-es.pdf` / `cv/cv-en.pdf` | Downloadable CV; the landing serves one or the other by language. |
| `tools/gen_icons.py`, `tools/gen_og.py` | Generators (Python/Pillow) for `icons/` and `img/og-photo.jpg`. Dev only — blocked from the public site. |
| `_headers` | Security headers applied by Cloudflare (see below). |
| `robots.txt` | Crawling: `Allow: /`, `Disallow: /cv/`, and the pointer to `sitemap.xml`. |
| `sitemap.xml` | Site map (landing + CV). |
| `functions/_middleware.js` | Edge middleware: returns `404` for non-public files (`README.md`, `.gitignore`, `/test/`, `/.claude/`, `/tools/`). |
| `test/checks.mjs` | Dependency-free smoke tests (Node). Run on session start via the `.claude/` hook. |

**Security (via `_headers`):** `X-Frame-Options: SAMEORIGIN` (anti-clickjacking) · `X-Content-Type-Options: nosniff` · `Referrer-Policy: no-referrer` · `Permissions-Policy` (blocks camera/microphone/geolocation).

> The site is **public and indexable** (see [🔎 SEO and indexing](#9--seo-and-indexing)). Being indexable doesn't change the security posture: the content was always public; now it also shows up in search engines.

---

## 2. 🎨 Design

Custom design, no CSS framework — the entire visual system is inline in each HTML file.

- **Typography:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) (text) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) (data/dates), from Google Fonts.
- **Accent color:** blue `#2e44c9`, centralized in CSS variables (`--blue`, `--name`, `--accent`…) → one change repaints everything.
- **Light/dark theme:** toggled with `data-theme` on `<html>`; each theme redefines the variables. The ☀️/🌙 button applies instantly.

**`index.html`:** centered card with photo, name, role, and buttons (LinkedIn · CV · References) with inline SVG icons; **floating chip** of photo+name on scroll; **attribute-based i18n** `data-es`/`data-en`; **QR + vCard** generated on the client.

**`CV-interactivo.html`:** "A4 sheet" layout with **CSS grid** (dark header, sidebar, experience column); **data-driven render** from the `DATA` object (ES/EN) → one source, two languages; opens in the landing's language via `?lang=`; **responsive** (collapses to one column at `max-width:680px`).

---

## 3. 📁 Repository structure

Files **grouped by type** (`img/`, `icons/`, `cv/`, `lib/`). Only what **must** be at the root stays there: the pages, `config.js`, and what Cloudflare reads from the root (`_headers`, `robots.txt`, `sitemap.xml`, `functions/`).

```
.
├── index.html              # Landing (link-in-bio)
├── CV-interactivo.html     # Interactive CV (JS render, ES/EN)
├── config.js               # ★ Centralized identity — read by landing + CV
├── img/                    # photo.jpg (shared) · og-photo.jpg (preview 1200×630)
├── icons/                  # favicon.svg/.ico · favicon-16/32.png · apple-touch-icon.png
├── cv/                     # cv-es.pdf · cv-en.pdf (downloadable CV)
├── lib/                    # qrcode.min.js (local, no CDN)
├── robots.txt              # Crawl rules + sitemap (SEO)
├── sitemap.xml             # Site map (landing + CV)
├── _headers                # Security headers
├── functions/_middleware.js # Hides docs/tooling from the public site
├── tools/                  # gen_icons.py · gen_og.py (generators, dev only)
├── test/checks.mjs         # Smoke tests (Node, no dependencies)
├── .claude/                # settings.json + hooks/session-start.sh
├── LICENSE                 # MIT license
├── .gitignore
└── README.md
```

---

## 4. ✨ Features

- ES / EN language switch (landing and CV, with continuity via `?lang=`)
- Light / dark theme (☀️ / 🌙)
- Buttons: LinkedIn · interactive CV · References
- CV download in PDF by language
- QR + vCard generated on the client
- Floating name/photo chip on scroll
- Open Graph / canonical meta tags for previews
- **SEO:** indexable, with `sitemap.xml` and `/cv/` excluded from results

---

## 5. 🧬 Make it your own

The personal content is **centralized** so you edit just a few places:

1. **`config.js`** — your identity: name, initials, role (ES/EN), anchor, email, links, `siteUrl`, vCard title, and greeting. Editing it updates landing and CV.
2. **`DATA` object in `CV-interactivo.html`** — the CV content (summary, experience, skills, education, languages, certifications) in Spanish and English.
3. **Photo** `img/photo.jpg` (square, ~800×800) — used by landing and CV. The bundled one is just a sample placeholder: replace it with yours.

The 4 things that **cannot** read `config.js` (static, read by crawlers/browser) and are edited by hand:

4. **`<head>`** of each HTML: `<title>`, `<link rel="canonical">`, and `og:*` / `twitter:*` metas. Grouped and commented.
5. **Favicon:** `python3 tools/gen_icons.py` — uses `initials` from `config.js` and the color from `index.html` to regenerate `icons/`.
6. **Share image** `img/og-photo.jpg`: `python3 tools/gen_og.py` — centers `img/photo.jpg` over a background sampled from the edge. The **PDFs** `cv/*.pdf` are replaced by hand.
7. **Domain:** configure `your-domain.com` in Cloudflare Pages and update `siteUrl` in `config.js` + the static absolute URLs (`canonical`, `og:url`/`og:image`, `sitemap.xml`, and the `Sitemap:` line in `robots.txt`).

> The `tools/` scripts need Python with Pillow (`pip install pillow`). When done: `node test/checks.mjs` and `git push`.

---

## 6. 🔧 Configuration (config.js)

| Field | What for |
|---|---|
| `firstName` / `lastName` / `initials` | Displayed name + favicon/title initials |
| `roleES` / `roleEN` | Landing subtitle (bilingual) |
| `anchorES` / `anchorEN` | Quantitative chip under the name (empty = hidden) |
| `email` / `linkedin` / `featured` | Contact and button links |
| `siteUrl` | QR + sharing |
| `vcardTitle` | Job title saved into the vCard |
| `chatGreetES` / `chatGreetEN` | Mini-chat greeting |
| `fileBase` | PDF file name on download (`<fileBase>-ES.pdf`) |

---

## 7. 🚀 Deployment

Cloudflare Pages + GitHub, native CI/CD: every `git push` to `main` redeploys on its own.

**1. Push the repo (once):**

```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USER/portfolio.git
git push -u origin main
```

**2. Connect Cloudflare Pages:** Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo. Build config: **Framework preset** `None`, **Build command** *(empty)*, **Output** `/` → **Save and Deploy**.

**3. Custom domain:** Pages → your project → **Custom domains** → add `your-domain.com`. Cloudflare sets up DNS + HTTPS automatically.

**Workflow:** edit → `git add . && git commit -m "update: ..." && git push` → redeploy in ~1 min.

---

## 8. 📊 Analytics (optional)

- **Visits:** Cloudflare Dashboard → your project → **Web Analytics** → enable. Zero code, no cookies.
- **Per-button click tracking:** already wired in `index.html` (`data-track` elements); logs to console by default. To send it to a service, follow the commented instructions in the `<script>`.

---

## 9. 🔎 SEO and indexing

The site is **public and indexable** — meant to be promoted and show up in search engines.

- **`robots.txt`**: `Allow: /` + sitemap pointer. The only block is `Disallow: /cv/`: the PDFs shouldn't appear as standalone results in Google; the entry point is the page.
- **`sitemap.xml`** (root): lists the two indexable pages —landing (`/`) and CV (`/CV-interactivo.html`)— with `<lastmod>`. Add new pages here.
- **Canonical:** each HTML declares its canonical URL with `<link rel="canonical">`, to avoid duplicate content.
- **`_headers`** only carries security headers (no `X-Robots-Tag`).

> The template ships **indexable** by default. To keep it out of search engines (e.g. while you build it), set `Disallow: /` in `robots.txt` and/or add `<meta name="robots" content="noindex">` to each HTML `<head>`.

---

## 10. 📌 Notes

- The site is **public and indexable** (see [🔎 SEO and indexing](#9--seo-and-indexing)). This doesn't make it more or less private: the content was always accessible with the link. For real privacy: Cloudflare Access (free up to 50 users).
- 100% static: no backend, database, or secrets. Don't commit credentials to the repo.

---

## 11. 🤖 AI editing guide

Internal tooling documentation, kept in **Spanish only**. See [🤖 Guía para una IA](#11--guía-para-una-ia).

---

## 12. 📄 License

Under the **MIT** license — see the [LICENSE](LICENSE) file.

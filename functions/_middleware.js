// Cloudflare Pages middleware — corre en el edge ANTES de servir archivos
// estáticos. En Pages los assets estáticos tienen prioridad sobre _redirects,
// así que esta es la forma confiable de evitar que se sirvan los archivos de
// documentación del repo: el código vive en GitHub, pero no en el sitio público.
const BLOCKED = [
  /^\/README(\.md)?$/i,
  /^\/\.gitignore$/i,
  /^\/test\//i,        // smoke-test suite — dev only, not for the public site
  /^\/\.claude\//i,    // Claude Code hooks/settings — dev only
  /^\/tools\//i,       // asset generators (favicon/OG) — dev only
];

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  if (BLOCKED.some((re) => re.test(pathname))) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return context.next();
}

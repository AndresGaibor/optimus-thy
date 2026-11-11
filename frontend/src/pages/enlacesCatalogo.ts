export function enlaceCatalogo(path: string): string {
  let base = '/';
  try {
    // El catálogo puede vivir en la raíz o bajo un subpath (por ejemplo `/storybook/`).
    base = window.parent.location.pathname;
  } catch {
    base = '/';
  }
  return `${base}${path}`;
}

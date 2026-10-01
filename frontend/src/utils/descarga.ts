/* Impresión: documentos en una pestaña aparte. */

/** Escapa caracteres de HTML para que un dato no rompa la cadena. */
export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

/** Abre una imagen adjunta en una pestaña aparte. Devuelve `false` si el
 *  navegador bloqueó la ventana emergente. */
export function abrirImagen(dataUrl: string, nombre = 'imagen'): boolean {
  const ventana = window.open()
  if (!ventana) return false
  ventana.document.write(
    `<title>${esc(nombre)}</title><body style="margin:0;display:grid;place-items:center;height:100vh;background:#0f172a">
     <img src="${esc(dataUrl)}" style="max-width:100%;max-height:100%"></body>`,
  )
  ventana.document.close()
  return true
}

/** Escribe el HTML en una pestaña nueva y abre el diálogo de impresión. */
export function imprimir(html: string): boolean {
  const ventana = window.open('', '_blank')
  if (!ventana) return false
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => ventana.print(), 350)
  return true
}

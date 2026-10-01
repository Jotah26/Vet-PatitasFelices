/** Minúsculas sin tildes, para que "vacuna" encuentre "Vacunación". */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

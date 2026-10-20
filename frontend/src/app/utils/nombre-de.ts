type Referencia = { nombre: string } | string | null | undefined;

export function nombreDe(ref: Referencia, porDefecto = '-'): string {
  return ref && typeof ref === 'object' ? ref.nombre : porDefecto;
}

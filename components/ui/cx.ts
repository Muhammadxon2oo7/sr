/** Class nomlarini xavfsiz birlashtirish. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

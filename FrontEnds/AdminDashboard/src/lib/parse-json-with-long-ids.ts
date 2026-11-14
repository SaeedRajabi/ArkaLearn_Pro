/**
 * JSON.parse corrupts integers larger than Number.MAX_SAFE_INTEGER.
 * Quote those numeric literals before parsing so IDs stay exact as strings.
 */
export function parseJsonWithLongIds(text: string): unknown {
  const sanitized = text.replace(/:\s*(-?\d{16,})(\s*[,}\]])/g, ': "$1"$2');
  return JSON.parse(sanitized);
}

export function isUmassEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@umass.edu');
}
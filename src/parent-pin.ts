export type ParentPIN = { salt: string; hash: string };
export const validPIN = (value: string) => /^\d{6}$/.test(value);
export function restorePIN(raw: string): ParentPIN {
  const value = JSON.parse(raw);
  if (typeof value?.salt !== 'string' || !/^[\da-f-]{36}$/i.test(value.salt) || typeof value.hash !== 'string' || !/^[\da-f]{64}$/i.test(value.hash)) throw new Error('Invalid parent PIN record');
  return { salt: value.salt, hash: value.hash };
}
export function matchesPIN(expected: string, actual: string) {
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}

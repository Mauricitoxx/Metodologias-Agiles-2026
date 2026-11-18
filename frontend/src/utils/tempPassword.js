// Sin letras ni números que se confundan al dictarla o copiarla a mano (0/O, 1/l/I)
export const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * Clave temporal para una cuenta de staff: "Frikio-XXXX-XXXX" (16 caracteres, 8 al azar).
 * Usa crypto.getRandomValues, no Math.random, porque es una contraseña real.
 */
export const generateTempPassword = (cryptoImpl = globalThis.crypto) => {
  const values = cryptoImpl.getRandomValues(new Uint32Array(8));
  const random = Array.from(values, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('');
  return `Frikio-${random.slice(0, 4)}-${random.slice(4, 8)}`;
};

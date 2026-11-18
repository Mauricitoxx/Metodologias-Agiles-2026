import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTempPassword, PASSWORD_ALPHABET } from '../utils/tempPassword.js';

test('la clave temporal tiene el formato Frikio-XXXX-XXXX con caracteres sin ambigüedad', () => {
  const pattern = new RegExp(`^Frikio-[${PASSWORD_ALPHABET}]{4}-[${PASSWORD_ALPHABET}]{4}$`);
  for (let i = 0; i < 200; i++) {
    const password = generateTempPassword();
    assert.match(password, pattern);
    assert.equal(password.length, 16);
    assert.doesNotMatch(password.slice(7), /[0O1lI]/);
  }
});

test('la clave temporal supera el mínimo de 12 caracteres del alta por consola', () => {
  assert.ok(generateTempPassword().length >= 12);
});

test('usa crypto.getRandomValues y no Math.random', () => {
  let calls = 0;
  const fakeCrypto = {
    getRandomValues(array) {
      calls++;
      array.fill(0);
      return array;
    }
  };
  const originalRandom = Math.random;
  Math.random = () => {
    throw new Error('No debe usarse Math.random');
  };
  try {
    assert.equal(generateTempPassword(fakeCrypto), `Frikio-AAAA-AAAA`);
    assert.equal(calls, 1);
  } finally {
    Math.random = originalRandom;
  }
});

test('genera claves distintas', () => {
  const passwords = new Set(Array.from({ length: 50 }, () => generateTempPassword()));
  assert.equal(passwords.size, 50);
});

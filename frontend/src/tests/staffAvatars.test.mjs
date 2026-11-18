import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STAFF_AVATARS, DEFAULT_STAFF_AVATAR } from '../utils/staffAvatars.js';

// El backend rechaza (422) cualquier avatar fuera de su lista: las dos tienen que coincidir
const backendSchema = readFileSync(
  new URL('../../../backend/app/schemas/administrador.py', import.meta.url),
  'utf-8'
);

test('los avatares del panel coinciden con los que acepta el backend', () => {
  const tuple = backendSchema.match(/^AVATARES = \(([^)]*)\)/m);
  assert.ok(tuple, 'No se encontró AVATARES en backend/app/schemas/administrador.py');
  const backendAvatars = [...tuple[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(STAFF_AVATARS, backendAvatars);
});

test('el avatar por defecto es el mismo en el panel y en el backend', () => {
  const backendDefault = backendSchema.match(/^AVATAR_POR_DEFECTO = "([^"]+)"/m);
  assert.ok(backendDefault);
  assert.equal(DEFAULT_STAFF_AVATAR, backendDefault[1]);
  assert.ok(STAFF_AVATARS.includes(DEFAULT_STAFF_AVATAR));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { findSignUp, forgetSignUp, saveSignUp, signUpPath } from '../utils/eventSignUps.js';

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
};
const activity = { id: 7, fecha_hora: '2026-11-07T18:00:00' };

test('Inscripción sin cuenta: recuerda el token de la fecha en que se inscribió', () => {
  const storage = memoryStorage();
  saveSignUp(activity, 'abc', storage);
  assert.equal(findSignUp(activity, storage), 'abc');
  assert.equal(findSignUp({ id: 8, fecha_hora: activity.fecha_hora }, storage), null);
});

test('Inscripción sin cuenta: una recurrente que pasó a su próxima fecha ya no figura inscripta', () => {
  const storage = memoryStorage();
  saveSignUp(activity, 'abc', storage);
  assert.equal(findSignUp({ ...activity, fecha_hora: '2026-11-14T18:00:00' }, storage), null);
});

test('Inscripción sin cuenta: cancelar olvida solo esa actividad', () => {
  const storage = memoryStorage();
  saveSignUp(activity, 'abc', storage);
  saveSignUp({ id: 8, fecha_hora: activity.fecha_hora }, 'def', storage);
  forgetSignUp(7, storage);
  assert.equal(findSignUp(activity, storage), null);
  assert.equal(findSignUp({ id: 8, fecha_hora: activity.fecha_hora }, storage), 'def');
});

test('Inscripción sin cuenta: sin almacenamiento o con datos corruptos no rompe', () => {
  assert.equal(findSignUp(activity, null), null);
  assert.doesNotThrow(() => saveSignUp(activity, 'abc', null));
  const broken = { getItem: () => '{no es json', setItem: () => { throw new Error('lleno'); } };
  assert.equal(findSignUp(activity, broken), null);
  assert.doesNotThrow(() => saveSignUp(activity, 'abc', broken));
  assert.equal(signUpPath('a-b_c'), '/eventos/inscripcion/a-b_c');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { dayLabel, filterSchedule, getScheduleReturnTo, groupScheduleByDay, isInProgress, scheduleTypes } from '../utils/publicSchedule.js';

const torneo = { id: 1, nombre: 'Torneo' };
const taller = { id: 2, nombre: 'Taller' };
const activities = [
  { id: 1, nombre: 'Torneo de Catán', tipo: torneo, estado: 'activa', duracion: 120, fecha_hora: '2026-11-07T18:00:00', fecha_hora_postergada: null },
  { id: 2, nombre: 'Taller de pintura', tipo: taller, estado: 'postergada', duracion: 60, fecha_hora: '2026-11-01T10:00:00', fecha_hora_postergada: '2026-11-07T20:00:00' },
  { id: 3, nombre: 'Torneo de Magic', tipo: torneo, estado: 'cancelada', duracion: 90, fecha_hora: '2026-11-08T17:00:00', fecha_hora_postergada: null },
];
const now = new Date('2026-11-07T19:00:00');

test('Cronograma: busca por nombre sin distinguir acentos y filtra por tipo', () => {
  assert.deepEqual(filterSchedule(activities, { search: ' catan ' }).map((a) => a.id), [1]);
  assert.deepEqual(filterSchedule(activities, { tipoId: '1' }).map((a) => a.id), [1, 3]);
  assert.deepEqual(filterSchedule(activities, { search: 'magic', tipoId: '2' }), []);
});

test('Cronograma: tipos únicos ordenados por nombre', () => {
  assert.deepEqual(scheduleTypes(activities).map((type) => type.nombre), ['Taller', 'Torneo']);
});

test('Cronograma: agrupa por la fecha efectiva (la postergada si existe)', () => {
  const days = groupScheduleByDay(activities, now);
  assert.deepEqual(days.map((day) => [day.label, day.activities.map((a) => a.id)]), [['Hoy', [1, 2]], ['Mañana', [3]]]);
  assert.equal(dayLabel('2026-11-10', now), 'Martes, 10 de noviembre');
});

test('Cronograma: en curso solo entre el inicio y el fin, nunca si está cancelada', () => {
  assert.equal(isInProgress(activities[0], now), true);
  assert.equal(isInProgress(activities[1], now), false);
  assert.equal(isInProgress({ ...activities[0], estado: 'cancelada' }, now), false);
});

test('Cronograma: el regreso desde el detalle solo acepta rutas del cronograma', () => {
  assert.equal(getScheduleReturnTo('/eventos?tipo=1'), '/eventos?tipo=1');
  assert.equal(getScheduleReturnTo('https://evil.example/eventos'), '/eventos');
  assert.equal(getScheduleReturnTo('/admin'), '/eventos');
  assert.equal(getScheduleReturnTo(undefined), '/eventos');
});

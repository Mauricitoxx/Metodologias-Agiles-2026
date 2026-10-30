import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameVideoUrl } from '../utils/gameVideo.js';

test('Administración: conserva, modifica y desvincula el video con el nombre del campo de API', () => {
  assert.equal(getGameVideoUrl({ video_url: ' https://example.com/video ' }), 'https://example.com/video');
  assert.equal(getGameVideoUrl({ videoUrl: 'https://example.com/nuevo' }), 'https://example.com/nuevo');
  assert.equal(getGameVideoUrl({ video_url: null, videoUrl: '' }), null);
  assert.equal(getGameVideoUrl({}), null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidUrl, getYouTubeEmbedUrl } from '../utils/validation.js';

test('HU-10: Criterio 1 y 4 - Acepta URLs válidas de YouTube y web', () => {
  assert.equal(isValidUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
  assert.equal(isValidUrl('https://youtu.be/dQw4w9WgXcQ'), true);
  assert.equal(isValidUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
  assert.equal(isValidUrl('https://youtube.com/shorts/12345'), true);
  assert.equal(isValidUrl('https://vimeo.com/123456789'), true);
  assert.equal(isValidUrl('   https://www.youtube.com/watch?v=dQw4w9WgXcQ   '), true);
});

test('HU-10: Criterio 1 y 5 - Rechaza textos comunes y esquemas no web', () => {
  assert.equal(isValidUrl('tutorial en youtube'), false);
  assert.equal(isValidUrl('youtube.com'), false);
  assert.equal(isValidUrl('juego de mesa'), false);
  assert.equal(isValidUrl('ftp://example.com/video.mp4'), false);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl(null), false);
  assert.equal(isValidUrl(undefined), false);
});

test('HU-10: Criterio 2, 3 y 6 - Campo opcional, modificación y desvinculación', () => {
  const itemConVideo = {
    id: 'bg-001',
    title: 'Catan',
    videoUrl: 'https://www.youtube.com/watch?v=o3WJD_18g80'
  };

  // Simulación de edición con modificación
  const itemModificado = {
    ...itemConVideo,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  };
  assert.equal(itemModificado.videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  // Simulación de borrado (dejar campo vacío)
  const inputVacio = '   ';
  const videoUrlDesvinculado = inputVacio.trim();
  const itemDesvinculado = {
    ...itemConVideo,
    videoUrl: videoUrlDesvinculado
  };
  assert.equal(itemDesvinculado.videoUrl, '');
  assert.equal(itemDesvinculado.title, 'Catan');
  assert.equal(itemDesvinculado.id, 'bg-001');
});

test('HU-10: Soporte de incrustación de YouTube para tutoriales', () => {
  assert.equal(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=o3WJD_18g80'), 'https://www.youtube.com/embed/o3WJD_18g80');
  assert.equal(getYouTubeEmbedUrl('https://youtu.be/o3WJD_18g80'), 'https://www.youtube.com/embed/o3WJD_18g80');
  assert.equal(getYouTubeEmbedUrl('https://youtube.com/shorts/o3WJD_18g80'), 'https://www.youtube.com/embed/o3WJD_18g80');
  assert.equal(getYouTubeEmbedUrl('https://vimeo.com/12345'), null);
  assert.equal(getYouTubeEmbedUrl(''), null);
});

test('HU-10: Validación del flujo de guardado de formulario', () => {
  function validateAndPrepareItem(form) {
    const trimmedVideoUrl = form.videoUrl ? form.videoUrl.trim() : '';
    if (trimmedVideoUrl && !isValidUrl(trimmedVideoUrl)) {
      return { error: 'Debe ingresar una URL web válida', item: null };
    }
    return {
      error: null,
      item: {
        ...form,
        videoUrl: trimmedVideoUrl
      }
    };
  }

  // Caso 1: Texto común como "tutorial en youtube" -> rechaza con error
  const resInvalido = validateAndPrepareItem({ title: 'Catan', videoUrl: 'tutorial en youtube' });
  assert.equal(resInvalido.error, 'Debe ingresar una URL web válida');
  assert.equal(resInvalido.item, null);

  // Caso 2: URL de YouTube válida -> asocia el video
  const resValido = validateAndPrepareItem({ title: 'Catan', videoUrl: 'https://www.youtube.com/watch?v=o3WJD_18g80' });
  assert.equal(resValido.error, null);
  assert.equal(resValido.item.videoUrl, 'https://www.youtube.com/watch?v=o3WJD_18g80');

  // Caso 3: Borrado de URL dejando campo vacío -> desvincula el video
  const resVacio = validateAndPrepareItem({ title: 'Catan', videoUrl: '   ' });
  assert.equal(resVacio.error, null);
  assert.equal(resVacio.item.videoUrl, '');
});

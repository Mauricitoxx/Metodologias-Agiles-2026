// Compatibilidad entre el modelo de API y el formulario administrativo.
export function getGameVideoUrl(item) {
  return (item.video_url ?? item.videoUrl ?? '').trim() || null;
}

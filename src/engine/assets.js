export function loadImages(manifest) {
  const entries = Object.entries(manifest);
  return Promise.all(entries.map(([key, src]) => loadImage(key, src))).then((loaded) =>
    Object.fromEntries(loaded),
  );
}

function loadImage(key, src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([key, image]);
    image.onerror = () => reject(new Error(`Failed to load image "${key}"`));
    image.src = src;
  });
}

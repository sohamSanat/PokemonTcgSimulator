/**
 * Preloads and decodes an image URL into browser/GPU memory.
 * Resolves safely on load, decode, or error (with safety timeout).
 */
export function preloadSingleImage(url: string | null | undefined, timeoutMs: number = 3500): Promise<void> {
  if (!url) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const timer = setTimeout(done, timeoutMs);

    const img = new Image();
    img.src = url;

    if (img.complete) {
      clearTimeout(timer);
      if (img.decode) {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    } else {
      img.onload = () => {
        clearTimeout(timer);
        if (img.decode) {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        done();
      };
    }
  });
}

/**
 * Preloads both the pack wrapper art images AND the card images concurrently.
 * Guarantees zero progressive image loading when the curtains open.
 */
export async function preloadPackAssets(
  packArtUrls: string[] = [],
  cards: Array<any> = [],
  timeoutMs: number = 4000
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Preload all pack wrapper arts
  for (const artUrl of packArtUrls) {
    if (artUrl) {
      promises.push(preloadSingleImage(artUrl, timeoutMs));
    }
  }

  // Preload all card images
  for (const card of cards) {
    const imgUrl = card?.image || card?.pokemon?.image || card?.card?.image;
    if (imgUrl) {
      promises.push(preloadSingleImage(imgUrl, timeoutMs));
    }
  }

  // Race with overall safety timeout so we never stall indefinitely
  const overallTimeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([Promise.all(promises), overallTimeout]);
}

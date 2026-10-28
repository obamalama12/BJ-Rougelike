// Keeps players on the newest build. GitHub Pages lets browsers reuse a cached copy of the page for
// a while, so the game asks the server which build is current (version.json, never cached) and:
// - on startup, if it's running an old copy, reloads straight into the new one, before you've done
//   anything (the address stays the same);
// - while you play, shows a small "new version" banner instead of reloading mid-hand.

declare const __BUILD_ID__: string;

const RELOADED_KEY = 'buckducks.reloadedFor';

async function latestBuild(): Promise<string | null> {
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

/** Load the page again past any cached copy (a fresh query string), then tidy the address. */
function loadBuild(id: string) {
  const url = new URL(location.href);
  url.searchParams.set('v', id);
  location.replace(url.toString());
}

function remember(id: string): boolean {
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === id) return false;
    sessionStorage.setItem(RELOADED_KEY, id);
  } catch {
    /* storage blocked: reload anyway, the query string busts the cache */
  }
  return true;
}

function showBanner(id: string) {
  if (document.getElementById('update-banner')) return;
  const b = document.createElement('button');
  b.id = 'update-banner';
  b.type = 'button';
  b.innerHTML = '<b>A new version of Buck Ducks is ready.</b> <span>Tap to refresh. Your run is saved.</span>';
  b.addEventListener('click', () => loadBuild(id));
  document.body.appendChild(b);
}

export function watchForUpdates() {
  if (!import.meta.env.PROD || location.protocol === 'file:') return;
  // Keep the address clean after a reload into a new build.
  const url = new URL(location.href);
  if (url.searchParams.has('v')) {
    url.searchParams.delete('v');
    history.replaceState(null, '', url.toString());
  }
  const check = async (startup: boolean) => {
    const id = await latestBuild();
    if (!id || id === __BUILD_ID__) return;
    if (startup && remember(id)) loadBuild(id);
    else showBanner(id);
  };
  void check(true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check(false);
  });
  setInterval(() => void check(false), 5 * 60 * 1000);
}

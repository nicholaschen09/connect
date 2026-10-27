const dongleIdPattern = /^[a-f0-9]{16}$/i;
const logIdPattern = /^[a-f0-9-]{20}$/i;
const numericPartPattern = /^\d+(?:\.\d+)?$/;

function pathParts(pathname = '/') {
  return pathname.split('/').filter(Boolean);
}

function numberPart(value) {
  if (!numericPartPattern.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Turn a browser location into the app's URL-owned state in one place.
 * Keep legacy timestamp URLs readable while new routes get explicit names.
 */
export function parseUrl(location = {}) {
  const pathname = typeof location === 'string' ? location : location.pathname || '/';
  const search = typeof location === 'string' ? '' : (location.search || '');
  const parts = pathParts(pathname);
  const dongleId = dongleIdPattern.test(parts[0] || '') ? parts[0] : null;
  const routeId = dongleId && logIdPattern.test(parts[1] || '') ? parts[1] : null;
  const routeStart = routeId && parts.length >= 4 ? numberPart(parts[2]) : null;
  const routeEnd = routeId && parts.length >= 4 ? numberPart(parts[3]) : null;
  const routeZoom = routeStart !== null && routeEnd !== null
    ? { start: routeStart * 1000, end: routeEnd * 1000 }
    : null;

  // Older links represented a time window as /:device/:start/:end. Retain
  // their original units; history middleware resolves them to a route.
  const legacyZoom = parts.length >= 3 && parts[0] !== 'auth'
    ? { start: Number(parts[1]), end: Number(parts[2]) }
    : null;

  let page = 'dashboard';
  if (pathname === '/referrals' || parts[0] === 'referrals') page = 'referrals';
  else if (dongleId && parts.length === 2 && parts[1] === 'prime') page = 'prime';
  else if (dongleId && parts.length === 2 && parts[1] === 'stream') page = 'stream';
  else if (dongleId && parts.length === 2 && parts[1] === 'settings') page = 'settings';
  else if (routeId || (dongleId && legacyZoom)) page = 'drive';

  return {
    pathname,
    search,
    query: Object.fromEntries(new URLSearchParams(search)),
    parts,
    dongleId,
    routeId,
    routeZoom,
    legacyZoom,
    primeNav: page === 'prime',
    streamNav: page === 'stream',
    settingsDongleId: page === 'settings' ? dongleId : null,
    page,
  };
}

// Compatibility helpers for callers which only need one URL field.
export function getDongleID(pathname) {
  return parseUrl(pathname).dongleId;
}

export function getZoom(pathname) {
  return parseUrl(pathname).legacyZoom;
}

export function getRouteId(pathname) {
  return parseUrl(pathname).routeId;
}

export function getRouteZoom(pathname) {
  return parseUrl(pathname).routeZoom;
}

export function getPrimeNav(pathname) {
  return parseUrl(pathname).primeNav;
}

export function getStreamNav(pathname) {
  return parseUrl(pathname).streamNav;
}

export function urlForDevice(dongleId) {
  return dongleId ? `/${dongleId}` : '/';
}

export function urlForSettings(dongleId) {
  return `/${dongleId}/settings`;
}

export function urlForDrive(dongleId, routeId, start, end) {
  const parts = [dongleId, routeId].filter(Boolean);
  if (routeId && start != null && end != null) parts.push(start, end);
  return `/${parts.join('/')}`;
}

export function urlForPrime(dongleId) {
  return `/${dongleId}/prime`;
}

export function urlForStream(dongleId) {
  return `/${dongleId}/stream`;
}

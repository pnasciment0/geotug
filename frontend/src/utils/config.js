// Central place for environment-dependent endpoints. In production the API and
// socket are served from the same origin; in dev they run on :4000.
const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd ? '' : 'http://localhost:4000';
export const SOCKET_URL = isProd ? undefined : 'http://localhost:4000';

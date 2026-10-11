/**
 * Runtime configuration of the SPA.
 *
 * The backend base URL is injected at container start into /config.js
 * (see docker-entrypoint.sh). In local development it falls back to
 * VITE_BACKEND_URL, and finally to the current origin.
 */

function runtimeBackendUrl() {
  if (typeof window !== 'undefined' && window.__AIR_TASK_CONFIG__) {
    return window.__AIR_TASK_CONFIG__.backendUrl;
  }
  return undefined;
}

/**
 * Returns the backend base URL without a trailing slash.
 */
export function getBackendUrl() {
  const url = runtimeBackendUrl() || import.meta.env.VITE_BACKEND_URL || window.location.origin;
  return String(url).replace(/\/+$/, '');
}

/**
 * Returns the MCP server endpoint as exposed to agents (backend origin + /mcp).
 */
export function getMcpEndpoint() {
  return `${getBackendUrl()}/mcp`;
}

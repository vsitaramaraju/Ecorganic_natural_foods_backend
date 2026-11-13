// Browser origins allowed to call the API and open a socket. Shared by Express CORS
// (src/app.js) and Socket.IO (src/socket.js) so the two can't drift apart.
//
// FRONTEND_URL is the site's main address (also used for links in emails).
// CORS_EXTRA_ORIGINS is an optional comma-separated list of other addresses,
// e.g. "https://www.ecorganic.store".
// Outside production the Vite dev server is always allowed.
const DEV_ORIGIN = "http://localhost:5173";

const stripSlash = url => url.trim().replace(/\/+$/, "");

const allowedOrigins = () => {
  const origins = [process.env.FRONTEND_URL, ...(process.env.CORS_EXTRA_ORIGINS || "").split(",")]
    .filter(Boolean)
    .map(stripSlash)
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") origins.push(DEV_ORIGIN);
  return [...new Set(origins)];
};

module.exports = { allowedOrigins };

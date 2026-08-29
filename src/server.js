require("dotenv").config();
const http = require("http");
const app = require('./app');
const { initSocket } = require("./socket");

const PORT = process.env.PORT || 5000;

// Socket.IO needs the raw HTTP server (not just the Express app) so it can
// upgrade connections to WebSockets on the same port the API runs on.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

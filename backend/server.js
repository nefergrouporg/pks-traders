const app = require('./app');
const http = require('http');
const { PORT } = require('./config/env');

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err}`);
  server.close(() => process.exit(1));
});
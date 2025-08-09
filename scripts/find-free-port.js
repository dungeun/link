const net = require('net');

function findFreePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        findFreePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// If called directly, find and print available port
if (require.main === module) {
  const startPort = process.argv[2] ? parseInt(process.argv[2]) : 3000;
  findFreePort(startPort)
    .then(port => {
      console.log(port);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error finding free port:', err);
      process.exit(1);
    });
}

module.exports = findFreePort;
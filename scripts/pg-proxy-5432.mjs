import net from 'net';

const LOCAL_PORT = 5432;
const TARGET_HOST = '172.21.54.21';
const TARGET_PORT = 54329;

const server = net.createServer((clientSocket) => {
  clientSocket.pause();
  const targetSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    clientSocket.resume();
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  clientSocket.on('error', (err) => {
    console.error('clientSocket error:', err.message);
    targetSocket.destroy();
  });
  targetSocket.on('error', (err) => {
    console.error('targetSocket error:', err.message);
    clientSocket.destroy();
  });
  clientSocket.on('close', () => targetSocket.destroy());
  targetSocket.on('close', () => clientSocket.destroy());
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log(`[PG Proxy] 127.0.0.1:${LOCAL_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});

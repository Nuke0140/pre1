import net from 'net';
import { spawn } from 'child_process';

const PORT = 54329;

const server = net.createServer((clientSocket) => {
  clientSocket.setNoDelay(true);

  const wslProc = spawn('wsl', ['-d', 'Ubuntu', '-e', 'nc', '127.0.0.1', '54329'], {
    stdio: ['pipe', 'pipe', 'ignore'],
    windowsHide: true,
  });

  clientSocket.pipe(wslProc.stdin, { end: false });
  wslProc.stdout.pipe(clientSocket, { end: false });

  clientSocket.on('error', () => {
    try { wslProc.kill(); } catch {}
  });

  wslProc.on('error', () => {
    try { clientSocket.destroy(); } catch {}
  });

  clientSocket.on('close', () => {
    try { wslProc.kill(); } catch {}
  });

  wslProc.on('close', () => {
    try { clientSocket.destroy(); } catch {}
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[WSL PG Proxy] Listening on 127.0.0.1:${PORT} -> WSL nc 127.0.0.1:54329`);
});

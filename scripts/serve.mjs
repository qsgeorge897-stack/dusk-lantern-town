import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer(async (request,response) => {
  if (!['GET','HEAD'].includes(request.method)) {response.writeHead(405); response.end(); return;}
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    const destination = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!destination.startsWith(root)) {response.writeHead(403); response.end(); return;}
    const bytes = await readFile(destination);
    response.writeHead(200, {'Content-Type':types[path.extname(destination)] || 'application/octet-stream'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {response.writeHead(404); response.end('Not found');}
});
server.listen(4174,'127.0.0.1',()=>console.log('暮灯镇: http://127.0.0.1:4174'));

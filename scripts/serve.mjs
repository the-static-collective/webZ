// Operator-free local static preview. Loopback only; this is not a delivery receiver.
import {createServer} from 'node:http';import {readFile,stat} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import {resolve,extname} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.split('/').some(s=>s.startsWith('.')))throw Error('HIDDEN');
 let path=resolve(root,'.'+pathname);if(path!==resolve(root)&&!path.startsWith(root))throw Error('OFF_BASE');if((await stat(path)).isDirectory())path=resolve(path,'index.html');
 const content=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(content);
 }catch{res.writeHead(404,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(await readFile(new URL('../404.html',import.meta.url)));}});
server.listen(Number(process.env.WEBZ_PORT??8080),'127.0.0.1',()=>console.log('webZ static preview: http://127.0.0.1:'+server.address().port));

// Loopback development server for the exact Worker and static frontend.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import worker from '../src/worker.mjs';

const root = new URL('../public/',import.meta.url);
const port = Number(process.env.PORT || 8799);
const fixtures = process.argv.includes('--fixtures');
if(fixtures) globalThis.fetch=async()=>new Response('# Browser test fixture\nA synthetic public document used only in the automated loopback browser test.\n');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.ico':'image/x-icon'};
const server = createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1:'+port);
    if(url.pathname.startsWith('/api/')) {
      // Stream request bytes through the Worker's own body budget.
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
      const result=await worker.fetch(request,{});
      res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
    }
    const name = url.pathname==='/' ? 'index.html' : url.pathname.slice(1);
    if(!/^[a-z0-9.-]+$/i.test(name)) {res.writeHead(404);res.end();return;}
    const path=new URL(name,root);
    const body=await readFile(fileURLToPath(path));
    const ext=name.slice(name.lastIndexOf('.'));
    res.writeHead(200,{'content-type':types[ext]||'application/octet-stream','cache-control':'no-store','content-security-policy':"default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'self'"});res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+port,fixtures})));

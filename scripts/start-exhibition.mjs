import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const webPort = Number(process.env.EXHIBITION_PORT ?? 3000), apiPort = Number(process.env.EXHIBITION_API_PORT ?? 8000);
if (![webPort, apiPort].every(port => Number.isInteger(port) && port > 1024 && port < 65536) || webPort === apiPort) throw new Error('Choose distinct exhibition ports between 1025 and 65535.');
if (!existsSync(path.join(root,'apps/web/.next/BUILD_ID'))) throw new Error('Run npm run check to prepare the production build first.');
const localPython = path.join(root,'.venv',process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = process.env.AGRIRAKSHAK_PYTHON ?? (existsSync(localPython) ? localPython : 'python3.12');
const api = spawn(python,['-m','uvicorn','agrirakshak_api.main:app','--app-dir','services/api/src','--host','127.0.0.1','--port',String(apiPort)],{cwd:root,stdio:'inherit',env:{...process.env,MODEL_BUNDLE_DIR:process.env.MODEL_BUNDLE_DIR ?? path.join(root,'services/api/model')}});
api.on('error',()=>console.error('Local model server could not start. Install services/api with Python 3.12 or set AGRIRAKSHAK_PYTHON. Farm records and the labelled interface demo still work.'));
const web = spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(webPort)],{cwd:path.join(root,'apps/web'),stdio:'inherit',env:{...process.env,INFERENCE_API_URL:`http://127.0.0.1:${apiPort}`}});
console.log(`Open http://127.0.0.1:${webPort}. Both servers stay on this laptop. Prepare offline files and export/check a backup before presenting.`);
let stopping = false;
function stop() { if(stopping)return;stopping=true;api.kill('SIGTERM');web.kill('SIGTERM'); }
process.on('SIGINT',stop);process.on('SIGTERM',stop);
web.on('error',error=>{console.error(error.message);process.exitCode=1;stop();});
web.on('exit',code=>{if(!stopping && code)process.exitCode=code;stop();});

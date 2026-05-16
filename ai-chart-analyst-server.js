const http = require('node:http');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const root = __dirname;
const analyzeHandler = require('./api/analyze');

const envPath = path.join(root, '.env.local');
if (fsSync.existsSync(envPath)) {
    const lines = fsSync.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;
        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (key && process.env[key] === undefined) {
            process.env[key] = value.replace(/^["']|["']$/g, '');
        }
    }
}

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
};

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify(data));
}

async function readBody(request) {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) {
            throw new Error('Request body is too large.');
        }
        chunks.push(chunk);
    }

    return Buffer.concat(chunks).toString('utf8');
}

async function serveFile(request, response) {
    const requestUrl = new URL(request.url, `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
    const filePath = path.resolve(root, `.${requestedPath}`);

    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    try {
        const data = await fs.readFile(filePath);
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        response.end(data);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
    }
}

const server = http.createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/api/analyze') {
        try {
            request.body = JSON.parse(await readBody(request));
            await analyzeHandler(request, response);
        } catch (error) {
            sendJson(response, 500, { error: error.message || 'Local proxy request failed.' });
        }
        return;
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
        await serveFile(request, response);
        return;
    }

    response.writeHead(405, { Allow: 'GET, HEAD, POST' });
    response.end('Method not allowed');
});

server.listen(port, host, () => {
    console.log(`AI Chart Analyst is running at http://${host}:${port}/`);
});

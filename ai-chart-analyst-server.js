const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const root = __dirname;

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

function isAllowedEndpoint(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname.endsWith('freemodel.dev');
    } catch {
        return false;
    }
}

async function handleAnalyze(request, response) {
    try {
        const body = JSON.parse(await readBody(request));
        const apiKey = String(body.apiKey || process.env.FREEMODEL_API_KEY || '').trim();
        const endpoint = String(body.endpoint || '').trim();
        const payload = body.payload;

        if (!apiKey) {
            sendJson(response, 400, { error: 'Missing FreeModel API key.' });
            return;
        }

        if (!isAllowedEndpoint(endpoint)) {
            sendJson(response, 400, { error: 'Endpoint must be an https://*.freemodel.dev URL.' });
            return;
        }

        if (!payload || typeof payload !== 'object') {
            sendJson(response, 400, { error: 'Missing analysis payload.' });
            return;
        }

        const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const text = await upstream.text();
        response.writeHead(upstream.status, {
            'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        });
        response.end(text);
    } catch (error) {
        sendJson(response, 500, { error: error.message || 'Local proxy request failed.' });
    }
}

async function serveFile(request, response) {
    const requestUrl = new URL(request.url, `http://${host}:${port}`);
    const requestedPath = decodeURIComponent(requestUrl.pathname === '/' ? '/ai-chart-analyst.html' : requestUrl.pathname);
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
        await handleAnalyze(request, response);
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

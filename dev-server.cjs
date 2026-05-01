const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env
try {
    const envFile = fs.readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)="?(.*?)"?$/);
        if (match) {
            process.env[match[1]] = match[2];
        }
    });
} catch (e) {}

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // API Route
    if (req.url === '/api/submit' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                req.body = JSON.parse(body);
                // Call our serverless function handler
                const handler = (await import('./api/submit.js')).default;
                
                // Mock Vercel res object
                const mockRes = {
                    status: (code) => {
                        res.statusCode = code;
                        return mockRes;
                    },
                    json: (data) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    }
                };
                
                await handler(req, mockRes);
            } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Static Files
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.jpeg': contentType = 'image/jpeg'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Local dev server running at http://localhost:${PORT}/`);
});

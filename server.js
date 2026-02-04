// server.js - Web wrapper for Gemini CLI on Render
const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gemini-cli-wrapper' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Gemini CLI Web Wrapper',
        endpoints: {
            '/health': 'Health check',
            '/prompt': 'POST - Send prompt to Gemini CLI',
            '/version': 'GET - Gemini CLI version'
        }
    });
});

// Get Gemini CLI version
app.get('/version', (req, res) => {
    const child = spawn('gemini', ['--version']);
    let output = '';

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { output += data.toString(); });

    child.on('close', (code) => {
        res.json({ version: output.trim(), exitCode: code });
    });
});

// Send prompt to Gemini CLI (non-interactive mode)
app.post('/prompt', async (req, res) => {
    const { prompt, timeout = 60000 } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    try {
        // Run gemini in non-interactive mode
        const child = spawn('gemini', ['-p', prompt], {
            env: { ...process.env },
            timeout: timeout
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => { stdout += data.toString(); });
        child.stderr.on('data', (data) => { stderr += data.toString(); });

        child.on('close', (code) => {
            res.json({
                response: stdout.trim(),
                error: stderr.trim() || null,
                exitCode: code
            });
        });

        child.on('error', (err) => {
            res.status(500).json({ error: err.message });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Gemini CLI wrapper running on port ${PORT}`);
    console.log(`   API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});

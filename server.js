// server.js - Web wrapper for Gemini CLI on Render
const express = require('express');
const { spawn } = require('child_process');

const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// AUTO-AUTH: Restore Google Login from Env
// ==========================================
try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        console.log('🔐 Restoring Google OAuth credentials from environment variable...');
        const geminiDir = path.join(os.homedir(), '.gemini');
        if (!fs.existsSync(geminiDir)) fs.mkdirSync(geminiDir, { recursive: true });

        // Write the OAuth token file
        const credsPath = path.join(geminiDir, 'oauth_creds.json');
        fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS_JSON);
        console.log('✅ Credentials restored to:', credsPath);

        // ALSO write settings.json to tell CLI to use OAuth
        const settingsPath = path.join(geminiDir, 'settings.json');
        const settingsContent = JSON.stringify({
            security: {
                auth: {
                    selectedType: "oauth-personal"
                }
            }
        }, null, 2);
        fs.writeFileSync(settingsPath, settingsContent);
        console.log('✅ Settings restored to:', settingsPath);
    }
} catch (error) {
    console.error('❌ Failed to restore credentials:', error.message);
}

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
            '/version': 'GET - Gemini CLI version',
            '/debug': 'GET - Debug auth config'
        }
    });
});

// Debug endpoint - check auth configuration
app.get('/debug', (req, res) => {
    const geminiDir = path.join(os.homedir(), '.gemini');
    const credsPath = path.join(geminiDir, 'oauth_creds.json');
    const settingsPath = path.join(geminiDir, 'settings.json');

    const result = {
        envVarPresent: !!process.env.GOOGLE_CREDENTIALS_JSON,
        envVarLength: process.env.GOOGLE_CREDENTIALS_JSON?.length || 0,
        geminiDir: geminiDir,
        geminiDirExists: fs.existsSync(geminiDir),
        oauthCredsExists: fs.existsSync(credsPath),
        settingsExists: fs.existsSync(settingsPath),
        settingsContent: null
    };

    if (result.settingsExists) {
        try {
            result.settingsContent = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (e) {
            result.settingsContent = 'ERROR: ' + e.message;
        }
    }

    res.json(result);
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
    console.log(`📨 POST /prompt received. Body:`, req.body);
    const { prompt, timeout = 60000 } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'prompt is required' });
    }

    // Auth is handled by either env var or ~/.gemini/oauth_creds.json
    // We let the CLI command fail if neither is present.

    try {
        // Run gemini in non-interactive mode
        // Assuming 'gemini <prompt>' works
        console.log(`Running: gemini "${prompt}"`);
        const child = spawn('gemini', [prompt], {
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

// get-login-token.js
// Run this LOCALLY to get the token for Render

const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to local Gemini credentials (macOS/Linux)
const credsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');

console.log('\n🔍 Checking for Gemini credentials...');

if (!fs.existsSync(credsPath)) {
    console.error('❌ No credentials found!');
    console.error('   Please run "npx @google/gemini-cli" first to login.');
    process.exit(1);
}

// Read and minify the JSON
try {
    const fileContent = fs.readFileSync(credsPath, 'utf8');
    // Validate it's JSON
    JSON.parse(fileContent);

    console.log('✅ Found credentials!');
    console.log('\n📋 COPY THE SINGLE LINE BELOW (and paste into Render env var GOOGLE_CREDENTIALS_JSON):\n');
    console.log(fileContent.trim()); // Just output the raw JSON string
    console.log('\n');
} catch (err) {
    console.error('❌ Error reading file:', err.message);
}

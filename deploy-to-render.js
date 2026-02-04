// deploy-to-render.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const RENDER_API_KEY = process.argv[2];
if (!RENDER_API_KEY) {
    console.error("Usage: node deploy-to-render.js <RENDER_API_KEY>");
    process.exit(1);
}

// 1. Read OAuth Credentials
const credsPath = path.join(os.homedir(), '.gemini', 'oauth_creds.json');
if (!fs.existsSync(credsPath)) {
    console.error("❌ No ~/.gemini/oauth_creds.json found. Please login locally first.");
    process.exit(1);
}
const oauthCreds = fs.readFileSync(credsPath, 'utf8').trim();

console.log("✅ Loaded Google Credentials");

// 2. Prepare Payload
const payload = {
    type: "web_service",
    name: "gemini-cli-api",
    ownerId: "me", // "me" works for personal accounts, or need to fetch owner ID? usually 'me' isn't supported in create, let's try. If fails, we list owners.
    // Actually, 'ownerId' is often required. Let's try to get it first or omit to see if it defaults.
    repo: "https://github.com/Rythamo8055/gemini-cli-docker",
    autoDeploy: true,
    branch: "main",
    serviceDetails: {
        runtime: "docker",
        plan: "free",
        region: "oregon", // or 'frankfurt', 'ohio', 'singapore'
        env: "docker",
        envSpecificDetails: {
            dockerFilePath: "./Dockerfile",
            dockerContext: "."
        },
        envVars: [
            { key: "PORT", value: "10000" },
            { key: "GOOGLE_CREDENTIALS_JSON", value: oauthCreds }
        ]
    }
};

// 3. Deploy
// 3. Deploy
async function deploy() {
    try {
        console.log("🔍 Fetching Render User ID...");

        // 3a. Get Owner ID
        const ownersReq = await fetch("https://api.render.com/v1/owners", {
            headers: {
                "Authorization": `Bearer ${RENDER_API_KEY}`,
                "Accept": "application/json"
            }
        });

        if (!ownersReq.ok) {
            const err = await ownersReq.text();
            throw new Error(`Failed to fetch owners: ${err}`);
        }

        const ownersData = await ownersReq.json();
        console.error("DEBUG ownersData:", JSON.stringify(ownersData, null, 2));

        // Try to extract ID from various common patterns
        let ownerId;
        if (ownersData[0].owner && ownersData[0].owner.id) {
            ownerId = ownersData[0].owner.id;
        } else if (ownersData[0].user && ownersData[0].user.id) {
            ownerId = ownersData[0].user.id;
        } else {
            ownerId = ownersData[0].id;
        }
        console.log(`✅ Use Owner ID: ${ownerId}`);

        // 3b. Construct Payload
        // API requires specific fields
        const finalPayload = {
            serviceDetails: {
                runtime: "docker",
                plan: "free",
                region: "oregon",
                env: "docker",
                envSpecificDetails: {
                    dockerContext: ".",
                    dockerFilePath: "./Dockerfile"
                },
                envVars: [
                    { key: "PORT", value: "10000" },
                    { key: "GOOGLE_CREDENTIALS_JSON", value: oauthCreds }
                ]
            },
            type: "web_service",
            name: "gemini-cli-automated",
            ownerId: ownerId,
            repo: "https://github.com/Rythamo8055/gemini-cli-docker",
            autoDeploy: "yes", // API expects string "yes"
            branch: "main"
        };

        console.log("🚀 Creating Service...");
        const response = await fetch("https://api.render.com/v1/services", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RENDER_API_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(finalPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Create Failed: ${JSON.stringify(data, null, 2)}`);
        }

        console.log("\n✅ SUCCESS! Service Created.");
        console.log(`🔗 Service URL: ${data.service.serviceDetails.url}`);
        console.log(`🖥️  Dashboard: https://dashboard.render.com/web/${data.service.id}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

deploy();

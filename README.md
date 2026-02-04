# Gemini CLI Docker - Cloud Deployment

Dockerized Gemini CLI that works with your **Google Pro subscription** in headless cloud environments.

## 🔐 Authentication Methods

| Method | Best For | Steps |
|--------|----------|-------|
| **OAuth (Pre-auth)** | Using your Google Pro subscription | Run `gemini` locally first, then mount tokens |
| **API Key** | Simple deployments, CI/CD | Set `GEMINI_API_KEY` env var |
| **Service Account** | Production, GCP integration | Mount JSON key file |

---

## 🚀 Quick Start

### Step 1: Authenticate Locally (One-time)
```bash
# Install and login with your Google account
npx @google/gemini-cli

# Complete OAuth in browser (uses your Pro subscription)
```

### Step 2: Setup Docker Credentials
```bash
chmod +x setup-auth.sh
./setup-auth.sh
```

### Step 3: Run in Docker
```bash
docker compose up gemini-cli
```

---

## ☁️ Cloud Deployment

### Deploy to Cloud Run
```bash
# Build and push
docker build -t gcr.io/YOUR_PROJECT/gemini-cli .
docker push gcr.io/YOUR_PROJECT/gemini-cli

# Deploy with secrets
gcloud run deploy gemini-cli \
  --image gcr.io/YOUR_PROJECT/gemini-cli \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

### Deploy to Railway/Render/Fly.io
1. Push this folder to a Git repo
2. Connect to your cloud provider
3. Set `GEMINI_API_KEY` as environment secret
4. Deploy!

---

## 📁 Directory Structure
```
gemini-cli-docker/
├── Dockerfile
├── docker-compose.yml
├── setup-auth.sh
├── README.md
└── credentials/           # Created by setup-auth.sh
    ├── .gemini/           # OAuth tokens (mounted)
    └── service-account.json  # GCP key (optional)
```

---

## ⚠️ Security Notes

- **Never commit** `credentials/` folder to Git
- Use **secrets managers** in production (GCP Secret Manager, AWS Secrets, etc.)
- Rotate API keys periodically
- Service accounts should have **minimal permissions**

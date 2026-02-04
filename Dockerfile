# Gemini CLI Web Wrapper - For Render Deployment

FROM node:20-slim

WORKDIR /app

# Install Gemini CLI and Express
RUN npm install -g @google/gemini-cli && \
  npm init -y && \
  npm install express

# Copy server file
COPY server.js .

# Expose port for Render
EXPOSE 10000

# Run the web server
CMD ["node", "server.js"]

# 🤖 AI Assistant with React + n8n + LLM + Memory + Internet

An AI-powered assistant built with a modular stack:  
**React (UI) + Node.js (API) + n8n (workflow engine) + LLM (OpenAI/local) + Memory + Web access + Voice I/O**

---

## 🚀 Features

- 🧠 Chat-based AI assistant using OpenAI or a local LLM
- 🔄 Workflow automation via [n8n](https://n8n.io)
- 🧩 Memory (short + long term) with vector search
- 🌐 Real-time internet access through APIs and scraping (via n8n)
- 🗣️ Voice input and text-to-speech output
- 💬 React-based frontend with natural UI

---

## 🧱 Architecture

```text
[React Frontend] <-> [Node.js API Middleware] <-> [n8n Workflow Engine]
                                |
                       [LLM (OpenAI / Local)]
                                |
                 [Memory: DB + Vector DB (e.g. Qdrant)]
                                |
             [Internet APIs / Scrapers (via n8n workflows)]

# Ollama Setup

## 1. Install and start Ollama

Install Ollama on your machine, then make sure the local API is running.

The app expects the default local base URL:

```text
http://127.0.0.1:11434
```

## 2. Pull a vision-capable model

For this project, a practical default is:

```bash
ollama pull gemma3
```

If you want an explicit multimodal variant with a smaller footprint, use:

```bash
ollama pull gemma3:4b
```

## 3. Configure `.env.local`

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3
```

If you pull `gemma3:4b`, set:

```bash
OLLAMA_MODEL=gemma3:4b
```

## 4. Run the app

```bash
npm run dev
```

If Ollama is unavailable, the app falls back to typed mock analysis so the UI can still be developed locally.

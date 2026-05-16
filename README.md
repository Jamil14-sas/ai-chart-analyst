# AI Chart Analyst

A standalone local web app for uploading a trading chart screenshot and analyzing it with FreeModel's OpenAI-compatible API.

## Features

- Upload PNG, JPG, or WEBP chart screenshots
- Uses FreeModel `/v1/chat/completions`
- Supports vision-capable model requests with image data URLs
- Displays signal, confidence, support, resistance, entry, take profit, stop loss, and detailed reasoning
- Includes a local proxy server to avoid browser CORS errors

## Requirements

- Node.js 18 or newer
- A FreeModel API key from <https://freemodel.dev/dashboard/keys>

## Run Locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:8787/
```

Paste your FreeModel API key in the app, keep the default endpoint as:

```text
https://api.freemodel.dev/v1/chat/completions
```

The default model is:

```text
gpt-5.5
```

## Security Note

The local proxy forwards your API key to FreeModel. Do not commit API keys or put them in the repository. The `.env` file is ignored by default.

## Disclaimer

AI-generated chart analysis is for educational purposes only and does not constitute financial advice.

# AI Chart Analyst

A web app for uploading a trading chart screenshot and analyzing it with FreeModel's OpenAI-compatible API.

The FreeModel key is stored server-side as a Vercel Environment Variable, so visitors can use the app without seeing or entering your API key.

## Features

- Upload PNG, JPG, or WEBP chart screenshots
- Uses FreeModel `/v1/chat/completions`
- Keeps `FREEMODEL_API_KEY` private on the server
- Displays signal, confidence, support, resistance, entry, take profit, stop loss, and detailed reasoning
- Works locally with the included Node server and on Vercel with `api/analyze.js`

## Vercel Setup

Create a Vercel project from this GitHub repository, then add these Environment Variables in Vercel:

```text
FREEMODEL_API_KEY=your_freemodel_key_here
FREEMODEL_MODEL=gpt-5.5
```

Set `FREEMODEL_API_KEY` for Production, Preview, and Development if you want all deployments to work.

Do not prefix the key with `NEXT_PUBLIC_`. That would expose it to the browser.

## Local Development

Create a local secret file:

```bash
cp .env.example .env.local
```

Set your key in `.env.local`, then run:

```bash
npm start
```

Open:

```text
http://127.0.0.1:8787/
```

## Security Note

The API key is read only by the server route at `/api/analyze`. Do not commit real API keys. `.env` and `.env.local` are ignored by default.

## Disclaimer

AI-generated chart analysis is for educational purposes only and does not constitute financial advice.

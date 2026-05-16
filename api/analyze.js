const endpoint = 'https://api.freemodel.dev/v1/chat/completions';
const defaultModel = 'gpt-5.5';

const promptText = `
You are an expert technical analyst with years of experience trading crypto, forex, and stocks.
Analyze the provided trading chart image.
Identify the prevailing trend, key chart patterns, and estimate the major support and resistance levels.
Based on your strict technical analysis, provide a definitive trading signal: "BUY", "SELL", or "HOLD".
Provide a confidence score for your signal from 0 to 100.
Also, estimate the optimal entry price, a reasonable take profit target, and a safe stop loss level.

IMPORTANT: You MUST respond ONLY with a valid JSON object. Do not include markdown blocks, backticks, or any other text outside the JSON.
Use the following exact schema:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": number,
  "entry": "string describing the specific entry price or zone",
  "takeProfit": "string describing the specific take profit price",
  "stopLoss": "string describing the specific stop loss price",
  "support": "string describing the support zone/price",
  "resistance": "string describing the resistance zone/price",
  "analysis": "string containing a detailed paragraph explaining your reasoning, patterns spotted, and trend context."
}`;

function sendJson(response, statusCode, data) {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(data));
}

function buildPayload({ mimeType, imageBase64 }) {
    return {
        model: process.env.FREEMODEL_MODEL || defaultModel,
        messages: [
            {
                role: 'system',
                content: 'You are a technical chart analyst. Return only valid JSON.'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: promptText
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${imageBase64}`
                        }
                    }
                ]
            }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
    };
}

module.exports = async function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
    }

    const apiKey = process.env.FREEMODEL_API_KEY;
    if (!apiKey) {
        sendJson(response, 500, { error: 'Server is missing FREEMODEL_API_KEY.' });
        return;
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {};
    const { mimeType, imageBase64 } = body;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || !imageBase64) {
        sendJson(response, 400, { error: 'A PNG, JPG, or WEBP image is required.' });
        return;
    }

    try {
        const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(buildPayload({ mimeType, imageBase64 }))
        });

        const text = await upstream.text();
        response.statusCode = upstream.status;
        response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(text);
    } catch (error) {
        sendJson(response, 500, { error: error.message || 'FreeModel request failed.' });
    }
};

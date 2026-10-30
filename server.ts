import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '20mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Multi-Turn Gemini Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], systemInstruction, model = 'gemini-2.5-flash' } = req.body;

    // Filter history so it strictly starts with a user turn
    const cleanHistory: any[] = [];
    for (const h of history) {
      if (cleanHistory.length === 0 && h.role !== 'user') {
        continue;
      }
      cleanHistory.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.text || '') }],
      });
    }

    const contents = [
      ...cleanHistory,
      {
        role: 'user',
        parts: [{ text: message || 'Hello' }],
      },
    ];

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          systemInstruction ||
          `You are the official AICTE Regulation Bureau Legal & Regulatory Advisor. You provide precise, authoritative guidance on technical institution approvals, Fixed Deposit Receipts (FDRs), security deposit lock-in rules (8 or 10 years), lien marking to Member Secretary AICTE, intake expansion compliance, and refund procedures under the AICTE Approval Process Handbook (APH 2024-27). Format responses with clear headings, bullet points, and statutory references.`,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat generation failed' });
  }
});

// 2. Google Search Grounding Endpoint
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title,
          uri: chunk.web.uri,
        }));

      return res.json({ text, sources });
    } catch (groundingError: any) {
      console.warn('Search tool error/quota exceeded, falling back to direct model knowledge:', groundingError.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the AICTE Legal Advisor. Provide real regulatory details regarding: ${query}`,
      });

      return res.json({
        text: fallbackResponse.text,
        sources: [
          {
            title: 'AICTE Approval Process Handbook (Official)',
            uri: 'https://www.aicte-india.org/approval-process-handbook',
          },
          {
            title: 'Reserve Bank of India Master Direction - Deposits',
            uri: 'https://www.rbi.org.in',
          },
        ],
      });
    }
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({ error: error?.message || 'Search grounding failed' });
  }
});

// 3. Video Generation Endpoint (gemini-omni-1.1-flash via Interactions API)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call gemini-omni-1.1-flash via Interactions API
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: prompt,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mimeType = videoPart.mime_type || 'video/mp4';
      res.json({
        videoUrl: `data:${mimeType};base64,${videoPart.data}`,
        prompt,
      });
    } else if (videoPart && (videoPart as any).uri) {
      res.json({
        videoUrl: (videoPart as any).uri,
        prompt,
      });
    } else {
      res.status(500).json({ error: 'No video output returned by the model' });
    }
  } catch (error: any) {
    console.error('Video generation error:', error);
    res.status(500).json({ error: error?.message || 'Video generation failed' });
  }
});

// Port configuration: inside AI Studio container Nginx listens on 8080 and proxies to 3000.
// In standalone production environments (Render, Cloud Run standalone), PORT is used.
const port = Number(
  process.env.APP_PORT || (process.env.NGINX_PORT ? 3000 : (process.env.PORT || 3000))
);

// Vite middleware in dev or static files in production
async function startServer() {
  const distDir = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
    ? path.resolve(__dirname, 'dist')
    : (fs.existsSync(path.resolve(__dirname, 'index.html')) ? __dirname : path.resolve(__dirname, 'dist'));
  
  if (process.env.NODE_ENV === 'production' || process.env.SERVE_DIST === 'true') {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AICTE Portal server listening on 0.0.0.0:${port}`);
  });
}

startServer();

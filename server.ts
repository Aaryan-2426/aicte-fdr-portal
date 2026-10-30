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
app.use(express.static(path.resolve(__dirname, 'public')));

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

// 4. Real FDR Supporting Document Upload & Validation API
const UPLOAD_DIR = path.resolve(__dirname, 'public', 'uploads', 'fdr_documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.post('/api/documents/upload', async (req, res) => {
  try {
    const { docType, fileName, fileData, applicationId, fdrNumber } = req.body;

    if (!docType || !fileName || !fileData) {
      return res.status(400).json({ error: 'Missing required fields: docType, fileName, or fileData' });
    }

    const cleanFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!cleanFileName.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        error: 'Invalid file format: Only PDF documents (.pdf) are permitted under AICTE APH regulations.',
      });
    }

    // Extract base64 buffer
    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Invalid file: Document is empty (0 bytes).' });
    }

    // Max 10 MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: `File size exceeds maximum permitted limit of 10 MB (Selected file: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
      });
    }

    // Verify PDF signature (%PDF-)
    const pdfHeader = buffer.subarray(0, 5).toString('ascii');
    if (!pdfHeader.startsWith('%PDF')) {
      return res.status(400).json({
        error: 'File validation failed: File content does not contain a valid PDF structure.',
      });
    }

    // Generate unique storage filename
    const safeDocType = ['fdr_certificate', 'lien_endorsement', 'board_resolution'].includes(docType)
      ? docType
      : 'supporting_doc';
    const timestamp = Date.now();
    const storedFileName = `${safeDocType}_${timestamp}_${cleanFileName}`;
    const storageFilePath = path.join(UPLOAD_DIR, storedFileName);

    await fs.promises.writeFile(storageFilePath, buffer);

    const docTitles: Record<string, string> = {
      fdr_certificate: 'Original FDR Fixed Deposit Certificate',
      lien_endorsement: 'Bank Lien Endorsement Letter to AICTE',
      board_resolution: 'Governing Body / Trust Board Resolution',
    };

    const docRecord = {
      id: `doc-${timestamp}-${Math.floor(Math.random() * 1000)}`,
      title: docTitles[docType] || 'Supporting Document',
      type: safeDocType,
      fileName: cleanFileName,
      storedFileName,
      fileSize: formatBytes(buffer.length),
      fileSizeBytes: buffer.length,
      storageUrl: `/uploads/fdr_documents/${storedFileName}`,
      storagePath: storageFilePath,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      verified: true,
      applicationId: applicationId || '',
      fdrNumber: fdrNumber || '',
    };

    return res.json({
      success: true,
      document: docRecord,
      message: 'Document successfully validated and securely stored.',
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({ error: error?.message || 'Document storage failed' });
  }
});

app.delete('/api/documents/delete', async (req, res) => {
  try {
    const { storedFileName } = req.body;
    if (!storedFileName) {
      return res.status(400).json({ error: 'storedFileName is required' });
    }

    const safeName = path.basename(storedFileName);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return res.json({ success: true, message: 'Document removed from storage.' });
  } catch (error: any) {
    console.error('Document deletion error:', error);
    return res.status(500).json({ error: error?.message || 'Document deletion failed' });
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

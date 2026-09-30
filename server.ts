import express from 'express';
import cors from 'cors';
import { GeminiVegetableAIService, PyTorchYOLOVegetableAIService } from './server/aiService.ts';
import { VegetableGradingEngine } from './server/gradingEngine.ts';
import type { IVegetableAIService } from './server/aiTypes.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));

  // Registry of replaceable AI models
  const geminiService = new GeminiVegetableAIService();
  const yoloService = new PyTorchYOLOVegetableAIService();
  let activeAIService: IVegetableAIService = geminiService;

  const gradingEngine = new VegetableGradingEngine();

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AgriGrade Server',
      activeModel: activeAIService.name,
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ai/models', (req, res) => {
    res.json({
      active: activeAIService.name,
      available: [
        { id: 'gemini-2.5-flash', name: geminiService.name, version: geminiService.version, status: 'Active (Production)' },
        { id: 'pytorch-yolo-produce', name: yoloService.name, version: yoloService.version, status: 'Plug-in Ready (Custom Weights Adapter)' },
      ],
    });
  });

  app.post('/api/ai/set-model', (req, res) => {
    const { modelId } = req.body;
    if (modelId === 'pytorch-yolo-produce') {
      activeAIService = yoloService;
    } else {
      activeAIService = geminiService;
    }
    res.json({ success: true, active: activeAIService.name });
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { imageBase64, mimeType, vegetableType, variety, calibrationReference, confidenceThreshold } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 payload is required' });
      }

      // Step 1: AI Vision Analysis
      const aiAnalysis = await activeAIService.analyze({
        imageBase64,
        mimeType: mimeType || 'image/jpeg',
        vegetableType: vegetableType || 'onion',
        variety: variety || 'Standard Bulb',
        calibrationReference: calibrationReference || 'none',
      });

      // Step 2: Separate Configurable Grading Engine
      const grading = gradingEngine.evaluate(
        vegetableType || 'onion',
        aiAnalysis,
        confidenceThreshold ? Number(confidenceThreshold) : undefined
      );

      return res.json({
        success: true,
        aiAnalysis,
        grading,
        processedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Analysis error in /api/ai/analyze:', error);
      return res.status(500).json({
        error: 'Failed to complete vegetable inspection analysis',
        details: error?.message || String(error),
      });
    }
  });

  // Attach Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 AgriGrade Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting AgriGrade server:', err);
});

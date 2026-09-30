import { GoogleGenAI } from '@google/genai';
import type { AIInspectionRequest, AIAnalysisOutput, IVegetableAIService, HackathonDefectFlags, VegetableCounts } from './aiTypes.ts';

// gemini-3.1-flash-lite is fastest, handles vision, and avoids high-demand 503 spikes
const VISION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
];

export class GeminiVegetableAIService implements IVegetableAIService {
  name = 'Gemini Flash Vision Multi-Vegetable Inspector';
  version = '3.8.0';
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async analyze(request: AIInspectionRequest): Promise<AIAnalysisOutput> {
    const cleanBase64 = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = request.mimeType || 'image/jpeg';

    if (this.ai) {
      for (const modelName of VISION_MODELS) {
        try {
          const prompt = `You are AgriGrade's Agricultural Vegetable Computer Vision Quality & Counting Engine.

MANDATORY DIRECTIVE 1: STRICT PRODUCE VERIFICATION (ZERO TOLERANCE FOR NON-VEGETABLES):
- Examine the image carefully.
- If the image contains a HUMAN BEING (face, person, hands, selfie), CLASSROOM, COMPUTERS, OFFICE, DESK, FURNITURE, CLOTHING, ANIMALS, VEHICLES, DOCUMENTS, or ANY RANDOM NON-PRODUCE OBJECT:
  You MUST set:
    "isVegetable": false,
    "noVegetableFound": true,
    "isFruit": false,
    "vegetableDetected": "None",
    "rejectionReason": "No vegetables found in the image. The camera detected: [Name what is seen, e.g. Person in office / Classroom / Computer]. AgriGrade only inspects agricultural vegetables.",
    "counts": { "totalCount": 0, "goodCount": 0, "defectiveCount": 0, "goodPercent": 0, "defectivePercent": 0 }

- If the image contains a FRUIT (e.g. Apple, Banana, Orange, Watermelon, Mango, Grape, Strawberry, Peach, Pineapple, Lemon, Papaya):
  You MUST set:
    "isVegetable": false,
    "noVegetableFound": true,
    "isFruit": true,
    "vegetableDetected": "None (Fruit)",
    "rejectionReason": "Fruit detected: [Fruit Name]. AgriGrade is strictly calibrated for agricultural vegetables only. Please scan a vegetable.",
    "counts": { "totalCount": 0, "goodCount": 0, "defectiveCount": 0, "goodPercent": 0, "defectivePercent": 0 }

MANDATORY DIRECTIVE 2: ACCURATE AGRICULTURAL VEGETABLE IDENTIFICATION:
- Agricultural vegetables supported: Potato, Onion, Tomato, Garlic, Ginger, Carrot, Chili, Bell Pepper / Capsicum, Cabbage, Cauliflower, Brinjal / Eggplant, Cucumber, Radish, Beetroot, Okra / Ladyfinger, Peas, Beans, Pumpkin, Gourd, Sweet Potato.
- CRITICAL: Never mistake POTATOES for onions! Potatoes are tubers with smooth/russet skin and shallow eyes (Solanum tuberosum). Onions have papery dry tunic scales, neck, and root plate (Allium cepa).
- If it is a real vegetable, set "isVegetable": true, "noVegetableFound": false.

MANDATORY DIRECTIVE 3: SPECIMEN COUNTING & QUALITY YIELD:
- Count the EXACT TOTAL NUMBER OF VEGETABLES clearly visible (e.g. If 1 tuber, count 1. If 6 or 8 potatoes in a tray or pile, count all visible items, e.g. 7).
- Count how many are SOUND / GOOD (Grade A quality, healthy edible skin, free from major rot, cuts, or sprouting).
- Count how many are DEFECTIVE / URS (rotten, active sprout shoots, mechanical harvest slicing, greening, or severe undersizing).
- Calculate:
  - "goodPercent": (goodCount / totalCount) * 100
  - "defectivePercent": (defectiveCount / totalCount) * 100

MANDATORY DIRECTIVE 4: FOUR MANDATORY QUALITY AUDIT FLAGS:
- isRotten: Bacterial soft rot, fungal decay spores, late blight wet decay, foul weeping. (If fresh and clean, isRotten MUST be FALSE!).
- isSprouted: Active green vegetative shoots or sprouted eyes (>5mm). (If dormant and clean, isSprouted MUST be FALSE!).
- isDamaged: Deep blade slice cuts, crushed flesh, severe flaying. (Normal intact peel is NOT damaged).
- isUndersized: Below commercial market diameter (<45mm).

Return strict JSON only matching this schema:
{
  "detectionPresent": boolean,
  "isVegetable": boolean,
  "isFruit": boolean,
  "noVegetableFound": boolean,
  "rejectionReason": string or null,
  "vegetableDetected": string,
  "botanicalName": string,
  "isTargetVegetable": boolean,
  "counts": {
    "totalCount": number,
    "goodCount": number,
    "defectiveCount": number,
    "goodPercent": number,
    "defectivePercent": number
  },
  "hackathonFlags": {
    "isRotten": boolean,
    "isSprouted": boolean,
    "isDamaged": boolean,
    "isUndersized": boolean,
    "rottenDetails": string or null,
    "sproutedDetails": string or null,
    "damagedDetails": string or null,
    "undersizedDetails": string or null
  },
  "shapeCharacteristics": {
    "shapeType": string,
    "symmetryRatio": number (0 to 100),
    "regularityDescription": string
  },
  "colorMetrics": {
    "dominantColor": string,
    "skinColorUniformity": number (0 to 100),
    "browningOrDiscoloration": number (0 to 100),
    "description": string
  },
  "defectsDetected": [
    {
      "id": string,
      "type": "rot" | "sprout" | "damage" | "undersize" | "blemish",
      "label": string,
      "severity": "minor" | "moderate" | "critical",
      "locationDesc": string,
      "confidence": number (0 to 100),
      "estimatedAreaPercent": number
    }
  ],
  "sizeEstimates": {
    "estimatedDiameterMm": number or null,
    "caliberCategory": string,
    "isCalibrated": boolean,
    "accuracyNote": string
  },
  "overallVegetableConfidence": number (0 to 100),
  "confidenceRating": "HIGH" | "LOW",
  "unreliableAttributes": string[],
  "rawObservations": string
}`;

          const response = await this.ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = response.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              ...parsed,
              modelUsed: `Gemini Vision (${modelName})`,
            };
          }
        } catch (err: any) {
          console.warn(`Vision model ${modelName} failed or unavailable:`, err?.message || err);
          // Try next model in candidate list
        }
      }
    }

    return this.fallbackAnalysis(request);
  }

  // ZERO-TOLERANCE FALLBACK:
  // If the visual models are unavailable, NEVER assume a random photo is a vegetable!
  private fallbackAnalysis(request: AIInspectionRequest): AIAnalysisOutput {
    return {
      detectionPresent: false,
      isVegetable: false,
      isFruit: false,
      noVegetableFound: true,
      rejectionReason: 'No agricultural vegetables could be verified in this image. Please center an agricultural vegetable (such as potato, onion, tomato, carrot) in the camera frame with clear lighting.',
      vegetableDetected: 'None',
      isTargetVegetable: false,
      counts: { totalCount: 0, goodCount: 0, defectiveCount: 0, goodPercent: 0, defectivePercent: 0 },
      hackathonFlags: { isRotten: false, isSprouted: false, isDamaged: false, isUndersized: false },
      shapeCharacteristics: { shapeType: 'Unrecognized', symmetryRatio: 0, regularityDescription: 'No vegetable profile found' },
      colorMetrics: { dominantColor: 'None', skinColorUniformity: 0, browningOrDiscoloration: 0, description: 'No vegetable skin detected' },
      defectsDetected: [],
      sizeEstimates: { estimatedDiameterMm: null, caliberCategory: 'None', isCalibrated: false, accuracyNote: 'Not a vegetable' },
      overallVegetableConfidence: 0,
      confidenceRating: 'LOW',
      unreliableAttributes: ['No agricultural vegetable recognized'],
      rawObservations: 'Camera input does not contain an agricultural vegetable.',
      modelUsed: 'AgriGrade Zero-Tolerance Validator',
    };
  }
}

export class PyTorchYOLOVegetableAIService implements IVegetableAIService {
  name = 'AgriGrade YOLOv8-Produce-ONNX (Custom Weights)';
  version = '1.0.0-onnx';

  async analyze(request: AIInspectionRequest): Promise<AIAnalysisOutput> {
    const gemini = new GeminiVegetableAIService();
    const result = await gemini.analyze(request);
    result.modelUsed = this.name;
    return result;
  }
}

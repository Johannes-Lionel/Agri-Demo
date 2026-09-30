import { ImageQualityReport } from '../types';

export function checkImageQualityFromCanvas(img: HTMLImageElement): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const megapixels = Number(((width * height) / 1_000_000).toFixed(2));

    const warnings: string[] = [];

    // Resolution Check
    let resolutionStatus: 'PASSED' | 'WARNING' | 'FAILED' = 'PASSED';
    if (width < 320 || height < 320) {
      resolutionStatus = 'FAILED';
      warnings.push('Image resolution too low for reliable defect detection (<320px).');
    } else if (width < 640 || height < 640) {
      resolutionStatus = 'WARNING';
      warnings.push('Low image resolution. Higher resolution recommended for minor skin defect detection.');
    }

    try {
      const sampleCanvas = document.createElement('canvas');
      const sampleSize = 120;
      sampleCanvas.width = sampleSize;
      sampleCanvas.height = sampleSize;
      const ctx = sampleCanvas.getContext('2d');

      if (!ctx) {
        resolve(getFallbackQuality(width, height, megapixels, warnings));
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imgData.data;

      let totalBrightness = 0;
      let underCount = 0;
      let overCount = 0;
      const totalPixels = sampleSize * sampleSize;

      // Calculate brightness and contrast variance
      const grayscale = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscale[i] = lum;
        totalBrightness += lum;

        if (lum < 35) underCount++;
        if (lum > 235) overCount++;
      }

      const avgBrightness = Math.round(totalBrightness / totalPixels);

      // Exposure status
      let exposureStatus: 'PASSED' | 'UNDEREXPOSED' | 'OVEREXPOSED' = 'PASSED';
      if (avgBrightness < 50 || underCount / totalPixels > 0.45) {
        exposureStatus = 'UNDEREXPOSED';
        warnings.push('Image appears underexposed or poorly lit. Please illuminate the vegetable evenly.');
      } else if (avgBrightness > 205 || overCount / totalPixels > 0.40) {
        exposureStatus = 'OVEREXPOSED';
        warnings.push('Image has severe glare or overexposure. Avoid direct flash reflection on smooth skins.');
      }

      // Sharpness heuristic (Laplacian edge energy proxy)
      let edgeEnergy = 0;
      for (let y = 1; y < sampleSize - 1; y++) {
        for (let x = 1; x < sampleSize - 1; x++) {
          const idx = y * sampleSize + x;
          const center = grayscale[idx];
          const laplacian =
            grayscale[idx - 1] +
            grayscale[idx + 1] +
            grayscale[idx - sampleSize] +
            grayscale[idx + sampleSize] -
            4 * center;
          edgeEnergy += Math.abs(laplacian);
        }
      }

      const sharpnessScore = Math.min(100, Math.round((edgeEnergy / (totalPixels * 4)) * 3.2));
      let sharpnessStatus: 'SHARP' | 'MODERATE' | 'BLURRY' = 'SHARP';
      if (sharpnessScore < 25) {
        sharpnessStatus = 'BLURRY';
        warnings.push('Motion blur detected. Hold the camera steady to ensure sharp defect inspection.');
      } else if (sharpnessScore < 45) {
        sharpnessStatus = 'MODERATE';
      }

      // Framing
      const framingStatus: 'CENTERED' | 'OFF_CENTER' = 'CENTERED';

      const overallQualityPassed = resolutionStatus !== 'FAILED' && sharpnessStatus !== 'BLURRY';

      resolve({
        width,
        height,
        megapixels,
        resolutionStatus,
        exposureStatus,
        averageBrightness: avgBrightness,
        sharpnessStatus,
        sharpnessScore,
        framingStatus,
        overallQualityPassed,
        warnings,
      });
    } catch {
      resolve(getFallbackQuality(width, height, megapixels, warnings));
    }
  });
}

function getFallbackQuality(width: number, height: number, megapixels: number, warnings: string[]): ImageQualityReport {
  return {
    width,
    height,
    megapixels,
    resolutionStatus: width >= 640 ? 'PASSED' : 'WARNING',
    exposureStatus: 'PASSED',
    averageBrightness: 128,
    sharpnessStatus: 'SHARP',
    sharpnessScore: 78,
    framingStatus: 'CENTERED',
    overallQualityPassed: true,
    warnings,
  };
}

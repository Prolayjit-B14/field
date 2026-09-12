/**
 * Mobile On-Device Image Quality Validator
 * Evaluates camera frames directly via HTML5 Canvas before AI processing:
 * 1. Laplacian variance for blur detection
 * 2. Luminance checks (too dark / overexposed)
 * 3. Green/yellow pixel ratio for leaf presence & size check
 */

export const validateCameraQuality = (canvas) => {
  if (!canvas) {
    return { passed: false, code: 'CANVAS_EMPTY', message: 'No image frame provided.' };
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  if (width === 0 || height === 0) {
    return { passed: false, code: 'INVALID_DIMENSIONS', message: 'Image dimensions are zero.' };
  }

  // Sample data at reduced resolution for instant mobile processing
  const sampleW = Math.min(width, 320);
  const sampleH = Math.min(height, 240);
  
  const offscreen = document.createElement('canvas');
  offscreen.width = sampleW;
  offscreen.height = sampleH;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(canvas, 0, 0, sampleW, sampleH);

  const imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  let totalLuminance = 0;
  let greenLeafPixels = 0;
  const totalPixels = sampleW * sampleH;

  // Grayscale buffer for Laplacian blur check
  const gray = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Standard perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    totalLuminance += lum;

    // Plant chromaticity heuristic (Green dominant over Red and Blue, or yellow-green)
    const isGreenPlant = (g > 50 && g > r * 1.05 && g > b * 1.15) || (r > 70 && g > 70 && b < 60 && Math.abs(r - g) < 40);
    if (isGreenPlant) {
      greenLeafPixels++;
    }
  }

  const meanLuminance = totalLuminance / totalPixels;
  const leafCoverage = greenLeafPixels / totalPixels;

  // Discrete 3x3 Laplacian variance for blur
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let count = 0;

  for (let y = 1; y < sampleH - 1; y += 2) {
    for (let x = 1; x < sampleW - 1; x += 2) {
      const idx = y * sampleW + x;
      // Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
      const lap = (
        gray[idx - sampleW] +
        gray[idx + sampleW] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx]
      );
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      count++;
    }
  }

  const laplacianMean = laplacianSum / count;
  const laplacianVariance = (laplacianSumSq / count) - (laplacianMean * laplacianMean);

  const metrics = {
    meanLuminance: Math.round(meanLuminance),
    blurVariance: Math.round(laplacianVariance),
    leafCoverageRatio: parseFloat(leafCoverage.toFixed(3)),
    sampleResolution: [sampleW, sampleH]
  };

  // 1. Exposure Decisions
  if (meanLuminance < 35) {
    return {
      passed: false,
      code: 'IMAGE_TOO_DARK',
      message: 'Photo is too dark. Move to a brighter spot or turn on flash.',
      metrics
    };
  }

  if (meanLuminance > 235) {
    return {
      passed: false,
      code: 'IMAGE_OVEREXPOSED',
      message: 'Direct sun glare is washing out the leaf. Shield the leaf from glare.',
      metrics
    };
  }

  // 2. Motion Blur Decision
  if (laplacianVariance < 45) {
    return {
      passed: false,
      code: 'IMAGE_TOO_BLURRY',
      message: 'Hold the phone steady and tap to focus before capturing.',
      metrics
    };
  }

  // 3. Plant Detection Decision
  if (leafCoverage < 0.08) {
    return {
      passed: false,
      code: 'NOT_A_PLANT_IMAGE',
      message: 'No plant or crop leaf clearly visible in the frame.',
      metrics
    };
  }

  // 4. Distance / Sizing Decision
  if (leafCoverage < 0.20) {
    return {
      passed: false,
      code: 'LEAF_TOO_SMALL',
      message: 'Leaf is too far away. Move closer so it fills the guide.',
      metrics
    };
  }

  return {
    passed: true,
    code: 'QUALITY_PASSED',
    message: 'Image quality verified for computer vision analysis.',
    metrics
  };
};

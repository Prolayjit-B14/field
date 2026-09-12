import React from 'react';
import AIVision from './AIVision';

/**
 * PestCropAnalysis has been merged into the unified AIVision & Pest Analysis screen.
 * Re-exports AIVision with default mode set to 'pest'.
 */
const PestCropAnalysis = () => {
  return <AIVision initialMode="pest" />;
};

export default PestCropAnalysis;

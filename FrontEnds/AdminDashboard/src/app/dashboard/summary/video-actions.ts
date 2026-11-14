'use server';

import {
  generateVideoSummary,
  GenerateVideoSummaryInput,
  GenerateVideoSummaryOutput,
} from '@/ai/flows/generate-video-summary';

export async function generateSummaryFromVideo(
  input: GenerateVideoSummaryInput
): Promise<GenerateVideoSummaryOutput> {
  try {
    const result = await generateVideoSummary(input);
    return result;
  } catch (e) {
    console.error('Error generating summary from video:', e);
    throw new Error('Failed to generate summary from video. Please try again.');
  }
}


'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary from a video recording.
 *
 * - generateVideoSummary - A function that takes video data and generates a summary.
 * - GenerateVideoSummaryInput - The input type for the generateVideoSummary function.
 * - GenerateVideoSummaryOutput - The return type for the generateVideoSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {GenerateMeetingSummaryOutputSchema} from './summary-schemas';

const GenerateVideoSummaryInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a meeting, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVideoSummaryInput = z.infer<
  typeof GenerateVideoSummaryInputSchema
>;

export type GenerateVideoSummaryOutput = z.infer<
  typeof GenerateMeetingSummaryOutputSchema
>;

export async function generateVideoSummary(
  input: GenerateVideoSummaryInput
): Promise<GenerateVideoSummaryOutput> {
  return generateVideoSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVideoSummaryPrompt',
  input: {schema: GenerateVideoSummaryInputSchema},
  output: {schema: GenerateMeetingSummaryOutputSchema},
  prompt: `You are an AI assistant that summarizes meeting recordings.

  Analyze the following video and generate a concise summary, identify the most important topics discussed, list the key decisions made, and describe the overall tone of the meeting.

  Meeting Video: {{media url=videoDataUri}}

  Summary:
  Important Topics: 
  Key Decisions: 
  Overall Tone: `,
});

const generateVideoSummaryFlow = ai.defineFlow(
  {
    name: 'generateVideoSummaryFlow',
    inputSchema: GenerateVideoSummaryInputSchema,
    outputSchema: GenerateMeetingSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

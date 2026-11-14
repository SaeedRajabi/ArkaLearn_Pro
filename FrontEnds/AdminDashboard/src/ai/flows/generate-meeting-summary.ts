
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating meeting summaries.
 *
 * - generateMeetingSummary - A function that takes meeting content and generates a summary.
 * - GenerateMeetingSummaryInput - The input type for the generateMeetingSummary function
 * - GenerateMeetingSummaryOutput - The return type for the generateMeetingSummary function
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateMeetingSummaryOutput, GenerateMeetingSummaryOutputSchema } from './summary-schemas';

const GenerateMeetingSummaryInputSchema = z.object({
  meetingContent: z
    .string()
    .describe('The transcript or notes from the meeting.'),
});
export type GenerateMeetingSummaryInput = z.infer<
  typeof GenerateMeetingSummaryInputSchema
>;

// Re-exporting the type for external use if needed by components
export type { GenerateMeetingSummaryOutput };


export async function generateMeetingSummary(
  input: GenerateMeetingSummaryInput
): Promise<GenerateMeetingSummaryOutput> {
  return generateMeetingSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingSummaryPrompt',
  input: {schema: GenerateMeetingSummaryInputSchema},
  output: {schema: GenerateMeetingSummaryOutputSchema},
  prompt: `You are an AI assistant that summarizes meetings.

  Given the following meeting content, generate a summary, identify important topics discussed, key decisions made, and the overall tone of the meeting.

  Meeting Content: {{{meetingContent}}}

  Summary:
  Important Topics: 
  Key Decisions: 
  Overall Tone: `,
});

const generateMeetingSummaryFlow = ai.defineFlow(
  {
    name: 'generateMeetingSummaryFlow',
    inputSchema: GenerateMeetingSummaryInputSchema,
    outputSchema: GenerateMeetingSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

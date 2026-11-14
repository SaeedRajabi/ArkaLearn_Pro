
import {z} from 'genkit';

/**
 * @fileOverview This file defines shared Zod schemas for meeting summaries.
 */

export const GenerateMeetingSummaryOutputSchema = z.object({
  summary: z.string().describe('The summary of the meeting.'),
  importantTopics: z
    .array(z.string())
    .describe('List of important topics discussed.'),
  keyDecisions: z.array(z.string()).describe('List of key decisions made.'),
  overallTone: z.string().describe('The overall tone of the meeting.'),
});
export type GenerateMeetingSummaryOutput = z.infer<
  typeof GenerateMeetingSummaryOutputSchema
>;

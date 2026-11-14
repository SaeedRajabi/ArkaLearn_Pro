'use server';

import {
  generateMeetingSummary,
  GenerateMeetingSummaryOutput,
} from '@/ai/flows/generate-meeting-summary';
import { z } from 'zod';

interface FormState {
  summary: GenerateMeetingSummaryOutput | null;
  error: string | null;
}

const MeetingContentSchema = z.string().min(50, 'Meeting content must be at least 50 characters long.');

export async function generateSummaryAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const meetingContent = formData.get('meetingContent');

  const validationResult = MeetingContentSchema.safeParse(meetingContent);
  if (!validationResult.success) {
    return {
      summary: null,
      error: validationResult.error.errors[0].message,
    };
  }
  
  try {
    const result = await generateMeetingSummary({
      meetingContent: validationResult.data,
    });
    return { summary: result, error: null };
  } catch (e) {
    console.error(e);
    return {
      summary: null,
      error: 'Failed to generate summary. Please try again.',
    };
  }
}

'use server';
/**
 * @fileOverview Generates a notification email for a user about a fault status change.
 *
 * - generateNotification - A function that handles the notification generation process.
 * - NotificationInput - The input type for the generateNotification function.
 * - NotificationOutput - The return type for the generateNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NotificationInputSchema = z.object({
  reporterName: z.string().describe('The name of the person who reported the fault.'),
  faultId: z.string().describe('The ID of the fault.'),
  newStatus: z.string().describe('The new status of the fault (e.g., "priskirtas", "vykdomas", "užbaigtas").'),
  faultDescription: z.string().describe('The original description of the fault.'),
  details: z.string().optional().describe('Any additional details about the status change, e.g., who it was assigned to.'),
});
export type NotificationInput = z.infer<typeof NotificationInputSchema>;

const NotificationOutputSchema = z.object({
  subject: z.string().describe('The subject line of the notification email.'),
  body: z.string().describe('The body content of the notification email.'),
});
export type NotificationOutput = z.infer<typeof NotificationOutputSchema>;

export async function generateNotification(input: NotificationInput): Promise<NotificationOutput> {
  return generateNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNotificationPrompt',
  input: { schema: NotificationInputSchema },
  output: { schema: NotificationOutputSchema },
  prompt: `You are an AI assistant for a building maintenance company. Your task is to generate a notification email in LITHUANIAN to a user about their reported fault.
The email must be professional, polite, and clear.

Generate a subject and a body for the email based on the following information:
- User's Name: {{{reporterName}}}
- Fault ID: {{{faultId}}}
- New Status: {{{newStatus}}}
- Original Fault Description: "{{{faultDescription}}}"
- Additional Details: {{{details}}}

The email body should:
1. Address the user by their name.
2. State the Fault ID.
3. Clearly inform them about the new status.
4. Include the additional details if provided.
5. End with a polite closing.

Example output format (in JSON):
{
  "subject": "Atnaujinta informacija apie jūsų gedimą #FAULT-XXX",
  "body": "Laba diena, {{reporterName}},\\n\\nInformuojame, kad jūsų užregistruoto gedimo #{{faultId}} būsena buvo atnaujinta į '{{newStatus}}'.\\n\\n{{details}}\\n\\nPagarbiai,\\nGedimų Registro komanda"
}
`,
});

const generateNotificationFlow = ai.defineFlow(
  {
    name: 'generateNotificationFlow',
    inputSchema: NotificationInputSchema,
    outputSchema: NotificationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate notification content.");
    }
    return output;
  }
);

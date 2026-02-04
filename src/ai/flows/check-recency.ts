'use server';

/**
 * @fileOverview Checks if a pilot meets the flight recency requirements.
 *
 * - checkRecency - A function that verifies if a pilot has at least 15 flight hours in the last 6 months.
 * - CheckRecencyInput - The input type for the checkRecency function.
 * - CheckRecencyOutput - The return type for the checkRecency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { subMonths, isAfter } from 'date-fns';

const FlightLogSchema = z.object({
    date: z.string().describe('The date of the flight in ISO format (YYYY-MM-DD).'),
    duration: z.number().describe('The duration of the flight in hours.'),
});

const CheckRecencyInputSchema = z.object({
  flights: z.array(FlightLogSchema).describe('An array of flight log objects.'),
});
export type CheckRecencyInput = z.infer<typeof CheckRecencyInputSchema>;

const CheckRecencyOutputSchema = z.object({
    hasRecency: z.boolean().describe('Whether the pilot has at least 15 flight hours in the last 6 months.'),
    totalHours: z.number().describe('The total flight hours within the last 6 months.'),
});
export type CheckRecencyOutput = z.infer<typeof CheckRecencyOutputSchema>;

export async function checkRecency(input: CheckRecencyInput): Promise<CheckRecencyOutput> {
  return checkRecencyFlow(input);
}

const checkRecencyFlow = ai.defineFlow(
  {
    name: 'checkRecencyFlow',
    inputSchema: CheckRecencyInputSchema,
    outputSchema: CheckRecencyOutputSchema,
  },
  async (input) => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    const recentFlights = input.flights.filter(flight => {
        try {
            const flightDate = new Date(flight.date);
            return isAfter(flightDate, sixMonthsAgo);
        } catch (e) {
            return false;
        }
    });

    const totalHours = recentFlights.reduce((sum, flight) => sum + flight.duration, 0);

    return {
      hasRecency: totalHours >= 15,
      totalHours: parseFloat(totalHours.toFixed(2)),
    };
  }
);

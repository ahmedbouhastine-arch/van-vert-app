'use server';

/**
 * @fileOverview Checks if a pilot meets the flight recency requirements.
 *
 * - checkRecency - A function that verifies if a pilot has at least 15 flight hours in the last 6 months.
 * - CheckRecencyInput - The input type for the checkRecency function.
 * - CheckRecencyOutput - The return type for the checkRecency function.
 */

import { flow } from '@genkit-ai/core/lib';
import { z } from 'zod';
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

const checkRecencyFlow = flow(
  {
    name: 'checkRecencyFlow',
    inputSchema: CheckRecencyInputSchema,
    outputSchema: CheckRecencyOutputSchema,
  },
  async (input) => {
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    // Helper function to remove ordinal suffixes (st, nd, rd, th) from dates
    const cleanDateString = (dateStr: string) => {
      if (!dateStr) return '';
      return dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
    };

    const recentFlights = input.flights.filter(flight => {
        try {
            // Clean the date string before parsing to handle formats like "June 9th, 2025"
            const flightDate = new Date(cleanDateString(flight.date));
            
            // Check for invalid date
            if (isNaN(flightDate.getTime())) {
                console.warn(`[Recency Check] Invalid date format encountered and could not be parsed: ${flight.date}`);
                return false;
            }
            return isAfter(flightDate, sixMonthsAgo);
        } catch (e) {
            console.error(`[Recency Check] Error parsing date: ${flight.date}`, e);
            return false;
        }
    });

    const totalHours = recentFlights.reduce((sum, flight) => sum + Number(flight.duration || 0), 0);

    return {
      hasRecency: totalHours >= 15,
      totalHours: parseFloat(totalHours.toFixed(2)),
    };
  }
);

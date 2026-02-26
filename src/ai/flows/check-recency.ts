'use server';
import 'server-only';

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
  const sixMonthsAgo = subMonths(new Date(), 6);
    
  const cleanDateString = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
  };

  const recentFlights = input.flights.filter(flight => {
      try {
          const flightDate = new Date(cleanDateString(flight.date));
          
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

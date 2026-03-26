import { HDate } from '@hebcal/core';
import { addDays, isBefore, isSameDay } from 'date-fns';

export function calculateHebrewRecurrenceDates(
  startDate: Date,
  endDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  const startHDate = new HDate(startDate);

  // Safety limit: max 500 events to prevent accidental infinite loops or massive data
  const MAX_EVENTS = 500;
  let count = 0;

  while (isBefore(current, endDate) || isSameDay(current, endDate)) {
    if (count >= MAX_EVENTS) break;

    const hDate = new HDate(current);

    if (frequency === 'daily') {
      dates.push(new Date(current));
    } else if (frequency === 'weekly') {
      if (current.getDay() === startDate.getDay()) {
        dates.push(new Date(current));
      }
    } else if (frequency === 'monthly') {
      // Same day of the Hebrew month
      if (hDate.getDate() === startHDate.getDate()) {
        dates.push(new Date(current));
      }
    } else if (frequency === 'yearly') {
      // Same day and month of the Hebrew year
      if (hDate.getDate() === startHDate.getDate() && hDate.getMonth() === startHDate.getMonth()) {
        dates.push(new Date(current));
      }
    }

    current = addDays(current, 1);
    count++;
  }

  return dates;
}

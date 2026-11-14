
import axios from 'axios';
import type { Seminar } from '@/lib/types';

export async function getSeminars(): Promise<Seminar[]> {
  try {
    // Adding a delay to simulate network latency for loading state
    await new Promise(resolve => setTimeout(resolve, 1500));
    const response = await axios.get('/data/seminars.json');
    const seminars = response.data.seminars.map((seminar: any) => ({
      ...seminar,
      date: new Date(seminar.date),
    }));
    return seminars;
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

export async function getSeminar(id: string): Promise<Seminar | undefined> {
    try {
        const seminars = await getSeminars();
        return seminars.find(seminar => seminar.id === id);
    } catch (error) {
        console.error(`Error fetching seminar with id ${id}:`, error);
        return undefined;
    }
}

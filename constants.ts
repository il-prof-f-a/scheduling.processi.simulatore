import { SchedulingAlgorithm } from './types';

export const ALGORITHM_DETAILS: { [key in SchedulingAlgorithm]: { name: string; description: string } } = {
  [SchedulingAlgorithm.FCFS]: {
    name: 'First-Come, First-Served',
    description: 'I clienti vengono serviti nell\'ordine in cui arrivano. Non-preemptive.'
  },
  [SchedulingAlgorithm.SJF]: {
    name: 'Shortest Job First',
    description: 'Il cliente con il tempo di servizio più breve viene servito per primo. Non-preemptive.'
  },
  [SchedulingAlgorithm.SRTF]: {
    name: 'Shortest Remaining Time First',
    description: 'Viene servito il cliente con il tempo rimanente più breve. Preemptive: il servizio viene interrotto se arriva un cliente più breve, o allo scadere del \'time slice\', momento in cui viene rivalutata la coda.'
  },
  [SchedulingAlgorithm.RR]: {
    name: 'Round Robin',
    description: 'A ogni cliente viene assegnata una piccola unità di tempo (time slice). Preemptive.'
  }
};

export const CLIENT_COLORS = [
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#fb923c', // orange-400
  '#60a5fa', // blue-400
  '#a3e635', // lime-400
];
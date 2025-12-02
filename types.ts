
export enum SchedulingAlgorithm {
  FCFS = 'FCFS',
  SJF = 'SJF',
  SRTF = 'SRTF',
  RR = 'RR',
}

export interface Client {
  id: number;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  completionTime?: number;
  waitingTime?: number;
  turnaroundTime?: number;
  color?: string;
}

export interface GanttBlock {
  clientId: number;
  start: number;
  end: number;
  type: 'running' | 'contextSwitch';
}

export interface SimulationResult {
  ganttChart: GanttBlock[];
  completedClients: Client[];
  metrics: {
    averageWaitingTime: number;
    averageTurnaroundTime: number;
    throughput: number;
  };
  totalTime: number;
}

import { Client, SchedulingAlgorithm, GanttBlock, SimulationResult } from '../types';

// Fix: Changed the return type annotation to match the actual returned object shape.
// The function returns a partial result which is then processed by `runSimulation`.
const runStandardSimulation = (
    clients: Client[],
    algorithm: SchedulingAlgorithm,
    timeSlice: number,
    contextSwitchCost: number
): { ganttChart: GanttBlock[]; completedClients: Client[]; contextSwitchCount: number } => {
    let completedClients: Client[] = [];
    const ganttChart: GanttBlock[] = [];
    let readyQueue: Client[] = [];
    let currentTime = 0;
    let lastRunningClientId: number | null = null;
    let contextSwitchCount = 0;
    let futureClients = [...clients].sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (completedClients.length < clients.length) {
        const newlyArrived = futureClients.filter(c => c.arrivalTime <= currentTime);
        if (newlyArrived.length > 0) {
            readyQueue.push(...newlyArrived);
            futureClients = futureClients.filter(c => !newlyArrived.find(na => na.id === c.id));
        }

        if (readyQueue.length === 0) {
            if (futureClients.length > 0) {
                currentTime = futureClients[0].arrivalTime;
                continue;
            } else {
                break;
            }
        }

        if (algorithm === SchedulingAlgorithm.SJF) {
            readyQueue.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
        } else if (algorithm === SchedulingAlgorithm.SRTF) {
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);
        } else if (algorithm === SchedulingAlgorithm.FCFS) {
            readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        }

        const clientToRun = readyQueue.shift()!;
        
        const isSwitching = lastRunningClientId !== null && lastRunningClientId !== clientToRun.id && completedClients.some(c => c.id === lastRunningClientId);
        if (lastRunningClientId !== null && lastRunningClientId !== clientToRun.id) {
            contextSwitchCount++;
            if (contextSwitchCost > 0) {
                ganttChart.push({ clientId: 0, start: currentTime, end: currentTime + contextSwitchCost, type: 'contextSwitch' });
                currentTime += contextSwitchCost;
                
                const arrivedDuringCS = futureClients.filter(c => c.arrivalTime <= currentTime);
                if (arrivedDuringCS.length > 0) {
                    readyQueue.push(...arrivedDuringCS);
                    futureClients = futureClients.filter(c => !arrivedDuringCS.find(ac => ac.id === c.id));
                }
            }
        }
        
        if (clientToRun.firstExecutionStartTime === undefined) {
            clientToRun.firstExecutionStartTime = currentTime;
        }

        const runDuration = (algorithm === SchedulingAlgorithm.SRTF)
            ? Math.min(clientToRun.remainingTime, timeSlice)
            : clientToRun.remainingTime;

        const executionStartTime = currentTime;
        currentTime += runDuration;
        clientToRun.remainingTime -= runDuration;
        
        ganttChart.push({ clientId: clientToRun.id, start: executionStartTime, end: currentTime, type: 'running' });
        lastRunningClientId = clientToRun.id;

        const arrivedDuringRun = futureClients.filter(c => c.arrivalTime <= currentTime);
        if (arrivedDuringRun.length > 0) {
            readyQueue.push(...arrivedDuringRun);
            futureClients = futureClients.filter(c => !arrivedDuringRun.find(ac => ac.id === c.id));
        }

        if (clientToRun.remainingTime > 0) {
            readyQueue.push(clientToRun);
        } else {
            clientToRun.completionTime = currentTime;
            clientToRun.waitingTime = (clientToRun.firstExecutionStartTime as number) - clientToRun.arrivalTime;
            clientToRun.turnaroundTime = clientToRun.completionTime - (clientToRun.firstExecutionStartTime as number);
            completedClients.push(clientToRun);
        }
    }
    return { ganttChart, completedClients, contextSwitchCount };
};

const runRoundRobinSimulation = (
    clients: Client[],
    timeSlice: number,
    contextSwitchCost: number
): { ganttChart: GanttBlock[]; completedClients: Client[]; contextSwitchCount: number } => {
    const completedClients: Client[] = [];
    const ganttChart: GanttBlock[] = [];
    let readyQueue: Client[] = [];
    let currentTime = 0;
    let lastRunningClientId: number | null = null;
    let contextSwitchCount = 0;
    let futureClients = [...clients].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let rrPointer = 0;

    while (completedClients.length < clients.length) {
        const newlyArrived = futureClients.filter(c => c.arrivalTime <= currentTime);
        if (newlyArrived.length > 0) {
            readyQueue.push(...newlyArrived);
            futureClients = futureClients.filter(c => !newlyArrived.find(na => na.id === c.id));
        }

        if (readyQueue.length === 0) {
            if (futureClients.length > 0) {
                currentTime = futureClients[0].arrivalTime;
                continue;
            } else {
                break;
            }
        }

        if (rrPointer >= readyQueue.length) {
            rrPointer = 0;
        }

        const clientToRun = readyQueue[rrPointer];

        if (lastRunningClientId !== null && lastRunningClientId !== clientToRun.id) {
            contextSwitchCount++;
            if (contextSwitchCost > 0) {
                ganttChart.push({ clientId: 0, start: currentTime, end: currentTime + contextSwitchCost, type: 'contextSwitch' });
                currentTime += contextSwitchCost;
                
                const arrivedDuringCS = futureClients.filter(c => c.arrivalTime <= currentTime);
                if (arrivedDuringCS.length > 0) {
                    readyQueue.push(...arrivedDuringCS);
                    futureClients = futureClients.filter(c => !arrivedDuringCS.find(ac => ac.id === c.id));
                }
            }
        }
        
        if (clientToRun.firstExecutionStartTime === undefined) {
            clientToRun.firstExecutionStartTime = currentTime;
        }

        const runDuration = Math.min(clientToRun.remainingTime, timeSlice);
        const executionStartTime = currentTime;
        currentTime += runDuration;
        clientToRun.remainingTime -= runDuration;
        
        ganttChart.push({ clientId: clientToRun.id, start: executionStartTime, end: currentTime, type: 'running' });
        lastRunningClientId = clientToRun.id;

        if (clientToRun.remainingTime <= 0) {
            clientToRun.completionTime = currentTime;
            clientToRun.waitingTime = (clientToRun.firstExecutionStartTime as number) - clientToRun.arrivalTime;
            clientToRun.turnaroundTime = clientToRun.completionTime - (clientToRun.firstExecutionStartTime as number);
            completedClients.push(clientToRun);
            readyQueue.splice(rrPointer, 1);
        } else {
            rrPointer++;
        }
    }
    return { ganttChart, completedClients, contextSwitchCount };
};


export const runSimulation = (
    initialClients: Client[],
    algorithm: SchedulingAlgorithm,
    timeSlice: number,
    contextSwitchCost: number
): SimulationResult => {
    let clients = JSON.parse(JSON.stringify(initialClients)) as Client[];
    let result: { ganttChart: GanttBlock[]; completedClients: Client[]; contextSwitchCount: number };

    if (algorithm === SchedulingAlgorithm.RR) {
        result = runRoundRobinSimulation(clients, timeSlice, contextSwitchCost);
    } else {
        result = runStandardSimulation(clients, algorithm, timeSlice, contextSwitchCost);
    }

    const { ganttChart, completedClients, contextSwitchCount } = result;

    completedClients.sort((a, b) => a.id - b.id);

    const totalTime = ganttChart.length > 0 ? Math.max(...ganttChart.map(b => b.end)) : 0;
    const totalWaitingTime = completedClients.reduce((acc, c) => acc + (c.waitingTime ?? 0), 0);
    const totalTurnaroundTime = completedClients.reduce((acc, c) => acc + (c.turnaroundTime ?? 0), 0);
    const totalClients = completedClients.length;
    const totalBurstTime = completedClients.reduce((acc, c) => acc + c.burstTime, 0);

    const totalAppliedContextSwitchCost = ganttChart
        .filter(b => b.type === 'contextSwitch')
        .reduce((acc, b) => acc + (b.end - b.start), 0);

    const totalBusyTime = totalBurstTime + totalAppliedContextSwitchCost;

    return {
        ganttChart,
        completedClients,
        metrics: {
            averageWaitingTime: totalClients > 0 ? totalWaitingTime / totalClients : 0,
            averageTurnaroundTime: totalClients > 0 ? totalTurnaroundTime / totalClients : 0,
            throughput: totalBusyTime > 0 ? (totalBurstTime / totalBusyTime) * 100 : 100,
            contextSwitchCount,
        },
        totalTime,
    };
};

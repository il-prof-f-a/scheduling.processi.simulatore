import { Client, SchedulingAlgorithm, GanttBlock, SimulationResult } from '../types';

export const runSimulation = (
    initialClients: Client[],
    algorithm: SchedulingAlgorithm,
    timeSlice: number,
    contextSwitchCost: number
): SimulationResult => {
    // Deep copy and sort by arrival time to handle initial state correctly
    let clients = JSON.parse(JSON.stringify(initialClients)) as Client[];
    clients.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
    
    const completedClients: Client[] = [];
    const ganttChart: GanttBlock[] = [];
    let readyQueue: Client[] = [];
    let currentTime = 0;
    let lastRunningClientId: number | null = null;
    
    const getRemainingClients = () => clients.filter(c => c.remainingTime > 0 && !completedClients.find(cc => cc.id === c.id));

    // The main loop continues as long as there are clients to process or in the ready queue
    while (getRemainingClients().length > 0 || readyQueue.length > 0) {
        
        // Add any clients that have arrived by the current time to the ready queue
        const newlyArrived = getRemainingClients().filter(c => c.arrivalTime <= currentTime && !readyQueue.find(rq => rq.id === c.id));
        readyQueue.push(...newlyArrived);
        
        // If the ready queue is empty, it means the CPU is idle.
        // We jump forward in time to the arrival of the next client.
        if (readyQueue.length === 0) {
            const remaining = getRemainingClients();
            if (remaining.length > 0) {
                currentTime = remaining[0].arrivalTime;
                const arrivedNow = remaining.filter(c => c.arrivalTime <= currentTime && !readyQueue.find(rq => rq.id === c.id));
                readyQueue.push(...arrivedNow);
            } else {
                break; // No more clients to process
            }
        }

        // Select the next client based on the scheduling algorithm
        let clientToRun: Client;
        if (algorithm === SchedulingAlgorithm.SJF) { // Non-preemptive
            readyQueue.sort((a, b) => a.burstTime - b.burstTime || a.id - b.id);
        } else if (algorithm === SchedulingAlgorithm.SRTF) {
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime || a.id - b.id);
        } else if (algorithm === SchedulingAlgorithm.FCFS) {
            readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        }
        // For Round Robin, no sort is needed as it's a FIFO queue. We just take the first element.
        
        clientToRun = readyQueue.shift()!;

        // Apply context switch cost if we are changing which client is running
        if (lastRunningClientId !== null && lastRunningClientId !== clientToRun.id && contextSwitchCost > 0) {
            ganttChart.push({ clientId: 0, start: currentTime, end: currentTime + contextSwitchCost, type: 'contextSwitch' });
            currentTime += contextSwitchCost;
        }

        // Determine how long this client will run for this turn
        const runDuration = (algorithm === SchedulingAlgorithm.RR || algorithm === SchedulingAlgorithm.SRTF)
            ? Math.min(clientToRun.remainingTime, timeSlice)
            : clientToRun.remainingTime;

        // Add the execution block to the Gantt chart
        const executionStartTime = currentTime;
        ganttChart.push({ clientId: clientToRun.id, start: executionStartTime, end: executionStartTime + runDuration, type: 'running' });

        // Update the simulation state
        currentTime += runDuration;
        clientToRun.remainingTime -= runDuration;
        lastRunningClientId = clientToRun.id;

        // After the execution slice, add any clients that arrived *during* that time
        const arrivedDuringRun = getRemainingClients().filter(c => c.id !== clientToRun.id && c.arrivalTime > executionStartTime && c.arrivalTime <= currentTime && !readyQueue.find(rq => rq.id === c.id));
        readyQueue.push(...arrivedDuringRun);

        // Handle the client's status after its run
        if (clientToRun.remainingTime <= 0) {
            // The client has finished
            clientToRun.completionTime = currentTime;
            clientToRun.turnaroundTime = clientToRun.completionTime - clientToRun.arrivalTime;
            clientToRun.waitingTime = clientToRun.turnaroundTime - clientToRun.burstTime;
            completedClients.push(clientToRun);
            lastRunningClientId = null; // The barber is free

            // If another client is ready to go, a context switch occurs
            if (readyQueue.length > 0 && contextSwitchCost > 0) {
                ganttChart.push({ clientId: 0, start: currentTime, end: currentTime + contextSwitchCost, type: 'contextSwitch' });
                currentTime += contextSwitchCost;
            }
        } else {
            // The client was preempted (for RR/SRTF) and needs to be re-queued
            readyQueue.push(clientToRun);
        }
    }
    
    // Final calculations
    completedClients.sort((a, b) => a.id - b.id);

    const totalTime = ganttChart.length > 0 ? Math.max(...ganttChart.map(b => b.end)) : 0;
    const totalWaitingTime = completedClients.reduce((acc, c) => acc + (c.waitingTime ?? 0), 0);
    const totalTurnaroundTime = completedClients.reduce((acc, c) => acc + (c.turnaroundTime ?? 0), 0);
    const totalClients = completedClients.length;

    return {
        ganttChart,
        completedClients,
        metrics: {
            averageWaitingTime: totalClients > 0 ? totalWaitingTime / totalClients : 0,
            averageTurnaroundTime: totalClients > 0 ? totalTurnaroundTime / totalClients : 0,
            throughput: totalClients > 0 ? totalClients / totalTime : 0,
        },
        totalTime,
    };
};

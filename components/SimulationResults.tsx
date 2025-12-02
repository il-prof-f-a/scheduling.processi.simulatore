
import React from 'react';
import { Client, SimulationResult } from '../types';
import { CLIENT_COLORS } from '../constants';
import { BarChart2Icon, ClockIcon } from './Icons';

interface SimulationResultsProps {
    result: SimulationResult | null;
    clients: Client[];
    isLoading: boolean;
}

const GanttChart: React.FC<{ result: SimulationResult, clients: Client[] }> = ({ result, clients }) => {
    const { ganttChart, totalTime, completedClients } = result;
    const clientColorMap = clients.reduce((acc, client, index) => {
        acc[client.id] = CLIENT_COLORS[index % CLIENT_COLORS.length];
        return acc;
    }, {} as { [id: number]: string });

    const sortedClients = [...clients].sort((a,b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
    const contextSwitches = ganttChart.filter(b => b.type === 'contextSwitch' && b.end > b.start);

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="relative" style={{ minWidth: `${totalTime * 20}px` }}>
                {/* Timeline */}
                <div className="flex h-6 items-center text-xs text-slate-400">
                    {Array.from({ length: totalTime + 1 }, (_, i) => (
                        <div key={i} className="flex-shrink-0 text-center" style={{ width: '20px' }}>
                            {i}
                        </div>
                    ))}
                </div>
                {/* Client Rows */}
                <div className="space-y-2 mt-2">
                    {sortedClients.map((client, idx) => {
                        const completedClient = completedClients.find(c => c.id === client.id);
                        if (!completedClient) return null;

                        const clientGanttBlocks = ganttChart.filter(block => block.clientId === client.id);
                        let lastEnd = client.arrivalTime;
                        const waitingBlocks = [];

                        clientGanttBlocks.forEach(block => {
                            if (block.start > lastEnd) {
                                waitingBlocks.push({ start: lastEnd, end: block.start });
                            }
                            lastEnd = block.end;
                        });

                        return (
                            <div key={client.id} className="relative h-8 flex items-center">
                                <div className="absolute -left-24 w-20 text-right pr-2 text-sm font-semibold text-slate-300 truncate">{client.name}</div>
                                
                                {/* Waiting time blocks */}
                                {waitingBlocks.map((waitBlock, i) => (
                                    <div
                                        key={`wait-${i}`}
                                        className="absolute h-6 rounded opacity-30"
                                        style={{
                                            left: `${waitBlock.start * 20}px`,
                                            width: `${(waitBlock.end - waitBlock.start) * 20}px`,
                                            backgroundColor: clientColorMap[client.id],
                                        }}
                                        title={`Attesa da ${waitBlock.start} a ${waitBlock.end}`}
                                    />
                                ))}

                                {/* Running time blocks */}
                                {clientGanttBlocks.map((block, i) => (
                                    <div
                                        key={`run-${i}`}
                                        className="absolute h-6 rounded flex items-center justify-center text-xs font-bold text-slate-900"
                                        style={{
                                            left: `${block.start * 20}px`,
                                            width: `${(block.end - block.start) * 20}px`,
                                            backgroundColor: clientColorMap[client.id],
                                        }}
                                        title={`Servizio da ${block.start} a ${block.end}`}
                                    />
                                ))}
                            </div>
                        );
                    })}
                     {/* Context Switch Row */}
                     {contextSwitches.length > 0 && (
                        <div className="relative h-8 flex items-center">
                            <div className="absolute -left-24 w-20 text-right pr-2 text-sm font-semibold text-slate-300 truncate">Sistema</div>
                            {contextSwitches.map((block, i) => (
                                <div
                                    key={`cs-${i}`}
                                    className="absolute h-6 bg-red-500 rounded"
                                    style={{
                                        left: `${block.start * 20}px`,
                                        width: `${(block.end - block.start) * 20}px`,
                                    }}
                                    title={`Context Switch (${block.start}-${block.end})`}
                                />
                            ))}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const MetricsDisplay: React.FC<{ result: SimulationResult }> = ({ result }) => {
    const { completedClients, metrics } = result;

    return (
        <div className="space-y-6">
            <div>
                 <h3 className="text-xl font-bold text-cyan-400 mb-2">Metriche per Cliente</h3>
                 <div className="overflow-x-auto -mx-1">
                    <div className="align-middle inline-block min-w-full px-1">
                        <div className="shadow overflow-hidden border-b border-slate-700 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-800">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Cliente</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Attesa</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Turnaround</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Completamento</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-900/70 divide-y divide-slate-700">
                                    {completedClients.map(c => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{c.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{c.waitingTime?.toFixed(2)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{c.turnaroundTime?.toFixed(2)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{c.completionTime?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>
            </div>
            <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Metriche Medie</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-400">Tempo Medio di Attesa</p>
                        <p className="text-2xl font-bold">{metrics.averageWaitingTime.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-400">Tempo Medio di Turnaround</p>
                        <p className="text-2xl font-bold">{metrics.averageTurnaroundTime.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-400">Throughput</p>
                        <p className="text-2xl font-bold">{metrics.throughput.toFixed(2)} clienti/unità</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SimulationResults: React.FC<SimulationResultsProps> = ({ result, clients, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <ClockIcon className="w-16 h-16 text-cyan-500 mb-4 animate-spin"/>
            <h2 className="text-2xl font-semibold">Simulazione in corso...</h2>
            <p>Il barbiere si sta dando da fare!</p>
        </div>
      );
    }
  
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <BarChart2Icon className="w-16 h-16 text-slate-600 mb-4"/>
                <h2 className="text-2xl font-semibold">In attesa della simulazione</h2>
                <p>Genera dei clienti e clicca "Esegui Simulazione" per vedere i risultati qui.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div>
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Diagramma di Gantt</h2>
                <GanttChart result={result} clients={clients} />
            </div>
            <div className="flex-grow">
                 <MetricsDisplay result={result} />
            </div>
        </div>
    );
};

export default SimulationResults;

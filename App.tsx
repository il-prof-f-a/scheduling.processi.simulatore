
import React, { useState, useCallback } from 'react';
import { SchedulingAlgorithm, Client, SimulationResult } from './types';
import { runSimulation } from './services/schedulingService';
import SchedulingControls from './components/SchedulingControls';
import SimulationResults from './components/SimulationResults';

const FANTASY_NAMES = [
    "Leo", "Sofia", "Alex", "Mia", "Elia", "Zoe", "Sam", "Iris", "Marco", "Giulia", "Nico", "Eva"
];

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>(SchedulingAlgorithm.FCFS);
  const [timeSlice, setTimeSlice] = useState<number>(4);
  const [useContextSwitch, setUseContextSwitch] = useState<boolean>(true);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0); // Used to re-mount components

  const handleGenerateClients = useCallback(() => {
    const shuffledNames = [...FANTASY_NAMES].sort(() => 0.5 - Math.random());
    const newClients: Client[] = Array.from({ length: 5 }, (_, i) => {
      const arrivalTime = Math.floor(Math.random() * 10);
      const burstTime = Math.floor(Math.random() * 10) + 1;
      return {
        id: Date.now() + i, // Use timestamp for more unique IDs
        name: shuffledNames[i % shuffledNames.length],
        arrivalTime,
        burstTime,
        remainingTime: burstTime,
      };
    }).sort((a, b) => a.arrivalTime - b.arrivalTime);
    setClients(newClients);
    setSimulationResult(null);
    setKey(prev => prev + 1); // Force re-render of children
  }, []);

  const handleRunSimulation = useCallback(() => {
    if (clients.length === 0) {
      alert("Per favore, aggiungi o genera prima i clienti.");
      return;
    }
    setIsLoading(true);
    setSimulationResult(null);
    // Deep copy clients to avoid mutation
    const clientsForSimulation = clients.map(c => ({...c, remainingTime: c.burstTime}));
    const contextSwitchCost = useContextSwitch ? 1 : 0;
    
    setTimeout(() => {
      const result = runSimulation(clientsForSimulation, algorithm, timeSlice, contextSwitchCost);
      setSimulationResult(result);
      setIsLoading(false);
    }, 500); // Simulate processing time
  }, [clients, algorithm, timeSlice, useContextSwitch]);

  const handleAddClient = useCallback(() => {
    const newClient: Client = {
      id: Date.now(),
      name: 'Nuovo Cliente',
      arrivalTime: 0,
      burstTime: 5,
      remainingTime: 5,
    };
    setClients(prevClients => [...prevClients, newClient]);
  }, []);

  const handleUpdateClient = useCallback((id: number, updatedData: Partial<Omit<Client, 'id'>>) => {
    setClients(prevClients => prevClients.map(client => 
      client.id === id ? { ...client, ...updatedData } : client
    ));
  }, []);

  const handleDeleteClient = useCallback((id: number) => {
    setClients(prevClients => prevClients.filter(client => client.id !== id));
  }, []);


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400 tracking-tight">
          Simulatore di Scheduling della Barbieria
        </h1>
        <p className="mt-2 text-lg text-slate-400">
          Visualizza gli algoritmi di scheduling dei processi come FCFS, SJF, SRTF e Round Robin.
        </p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col">
          <SchedulingControls
            clients={clients}
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            timeSlice={timeSlice}
            setTimeSlice={setTimeSlice}
            useContextSwitch={useContextSwitch}
            setUseContextSwitch={setUseContextSwitch}
            onGenerateClients={handleGenerateClients}
            onRunSimulation={handleRunSimulation}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            isLoading={isLoading}
          />
        </aside>

        <main className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-700 overflow-hidden">
          <SimulationResults
            result={simulationResult}
            clients={clients}
            key={key}
            isLoading={isLoading}
          />
        </main>
      </div>
       <footer className="text-center mt-8 text-slate-500 text-sm">
        <p>Realizzato per la didattica - Terza Superiore di Informatica</p>
      </footer>
    </div>
  );
};

export default App;

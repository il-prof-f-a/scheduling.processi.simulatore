
import React from 'react';
import { Client, SchedulingAlgorithm } from '../types';
import { ALGORITHM_DETAILS } from '../constants';
import { ListIcon, PlayIcon, RefreshCwIcon, PlusIcon, TrashIcon } from './Icons';

interface SchedulingControlsProps {
  clients: Client[];
  algorithm: SchedulingAlgorithm;
  setAlgorithm: (algo: SchedulingAlgorithm) => void;
  timeSlice: number;
  setTimeSlice: (ts: number) => void;
  useContextSwitch: boolean;
  setUseContextSwitch: (use: boolean) => void;
  onGenerateClients: () => void;
  onRunSimulation: () => void;
  onAddClient: () => void;
  onUpdateClient: (id: number, data: Partial<Omit<Client, 'id'>>) => void;
  onDeleteClient: (id: number) => void;
  isLoading: boolean;
}

const SchedulingControls: React.FC<SchedulingControlsProps> = ({
  clients,
  algorithm,
  setAlgorithm,
  timeSlice,
  setTimeSlice,
  useContextSwitch,
  setUseContextSwitch,
  onGenerateClients,
  onRunSimulation,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Controlli</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="algorithm" className="block text-sm font-medium text-slate-300 mb-1">
              Algoritmo di Scheduling
            </label>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as SchedulingAlgorithm)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            >
              {Object.values(SchedulingAlgorithm).map((algo) => (
                <option key={algo} value={algo}>{ALGORITHM_DETAILS[algo].name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">{ALGORITHM_DETAILS[algorithm].description}</p>
          </div>

          {(algorithm === SchedulingAlgorithm.RR || algorithm === SchedulingAlgorithm.SRTF) && (
            <div>
              <label htmlFor="time-slice" className="block text-sm font-medium text-slate-300 mb-1">
                Time Slice (Quantum)
              </label>
              <input
                type="number"
                id="time-slice"
                value={timeSlice}
                min={1}
                onChange={(e) => setTimeSlice(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              />
            </div>
          )}

          <div>
            <div className="relative flex items-start">
                <div className="flex items-center h-5">
                <input
                    id="context-switch"
                    aria-describedby="context-switch-description"
                    name="context-switch"
                    type="checkbox"
                    checked={useContextSwitch}
                    onChange={(e) => setUseContextSwitch(e.target.checked)}
                    className="focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-slate-500 rounded bg-slate-700"
                />
                </div>
                <div className="ml-3 text-sm">
                <label htmlFor="context-switch" className="font-medium text-slate-300">
                    Includi Costo Context Switch
                </label>
                <p id="context-switch-description" className="text-xs text-slate-400">
                    Se attivo, ogni cambio cliente avrà un costo di 1 unità di tempo.
                </p>
                </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
            <button
              onClick={onGenerateClients}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-slate-900 bg-slate-300 hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 focus:ring-offset-slate-900 transition-colors"
            >
              <RefreshCwIcon className="w-5 h-5 mr-2" />
              Genera Clienti
            </button>
            <button
              onClick={onRunSimulation}
              disabled={isLoading || clients.length === 0}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 disabled:bg-cyan-800 disabled:text-cyan-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Esecuzione...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Esegui Simulazione
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col min-h-0">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Coda Clienti</h2>
        {clients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700 text-center p-4">
              <ListIcon className="w-12 h-12 text-slate-600 mb-2"/>
            <p className="text-slate-400">Nessun cliente in attesa.</p>
            <p className="text-sm text-slate-500">Aggiungi o genera clienti per iniziare.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pr-2 -mr-2 flex-grow">
            {/* Header */}
            <div className="grid grid-cols-[1fr,60px,80px,30px] gap-2 text-xs font-medium text-slate-400 uppercase px-2">
                <span>Nome</span>
                <span className="text-center">Arrivo</span>
                <span className="text-center">Servizio</span>
                <span></span>
            </div>
             {clients.map((client) => (
                <div key={client.id} className="grid grid-cols-[1fr,60px,80px,30px] gap-2 items-center bg-slate-900/70 p-2 rounded-md">
                    <input 
                        type="text"
                        value={client.name}
                        onChange={(e) => onUpdateClient(client.id, { name: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                     <input 
                        type="number"
                        value={client.arrivalTime}
                        min={0}
                        onChange={(e) => onUpdateClient(client.id, { arrivalTime: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                     <input 
                        type="number"
                        value={client.burstTime}
                        min={1}
                        onChange={(e) => onUpdateClient(client.id, { burstTime: parseInt(e.target.value, 10) || 1 })}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button onClick={() => onDeleteClient(client.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-full">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
             ))}
          </div>
        )}
        <div className="mt-4">
            <button
                onClick={onAddClient}
                className="w-full inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-600 hover:border-cyan-500 hover:text-cyan-500 text-sm font-medium rounded-md shadow-sm text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-colors"
            >
                <PlusIcon className="w-5 h-5 mr-2"/>
                Aggiungi Cliente
            </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulingControls;

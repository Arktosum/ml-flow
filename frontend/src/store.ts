import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';
import type {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from 'reactflow';

import type { CsvNodeData } from './components/CsvNode';
import type { DataInspectNodeData } from './components/DataInspectNode';
import type { PlotNodeData } from './components/PlotNode';

export type AppNodeData = CsvNodeData | DataInspectNodeData | PlotNodeData | Record<string, unknown>;

export type AppState = {
    nodes: Node<AppNodeData>[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    updateNodeData: (nodeId: string, data: Partial<AppNodeData>) => void;
    executeNode: (nodeId: string) => Promise<void>;
    addNode: (type: string, position: { x: number, y: number }) => void;
};

const useStore = create<AppState>((set, get) => ({
    nodes: [
        {
            id: 'node-1',
            type: 'csvInput',
            position: { x: 50, y: 150 },
            data: { file: undefined },
        }
    ],
    edges: [],

    onNodesChange: (changes: NodeChange[]) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes: EdgeChange[]) => set({ edges: applyEdgeChanges(changes, get().edges) }),

    onConnect: async (connection: Connection) => {
        set({ edges: addEdge(connection, get().edges) });
        const state = get();
        const sourceNode = state.nodes.find((n) => n.id === connection.source);
        const targetNode = state.nodes.find((n) => n.id === connection.target);

        // Frontend header extraction for autocomplete
        if (sourceNode?.type === 'csvInput' && targetNode?.type === 'plotNode') {
            const file = (sourceNode.data as CsvNodeData).file;
            if (file) {
                const text = await file.slice(0, 2000).text();
                const headers = text.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''));
                state.updateNodeData(targetNode.id, { availableColumns: headers });
            }
        }

        get().executeNode(connection.target);
    },

    updateNodeData: (nodeId: string, data: Partial<AppNodeData>) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) return { ...node, data: { ...node.data, ...data } };
                return node;
            }),
        });
    },

    addNode: (type: string, position: { x: number, y: number }) => {
        const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            data: type === 'plotNode' ? { plotType: 'hist' } : {},
        };
        set({ nodes: [...get().nodes, newNode] });
    },

    executeNode: async (nodeId: string) => {
        const state = get();
        const targetNode = state.nodes.find((n) => n.id === nodeId);
        const incomingEdge = state.edges.find((e) => e.target === nodeId);
        if (!targetNode || !incomingEdge) return;

        const sourceNode = state.nodes.find((n) => n.id === incomingEdge.source);
        const file = (sourceNode?.data as CsvNodeData)?.file;

        if (!file) {
            state.updateNodeData(nodeId, { status: 'Error: No source file' });
            return;
        }

        if (targetNode.type === 'dataInspect') {
            state.updateNodeData(nodeId, { status: 'Parsing CSV...', info: undefined });
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch('http://localhost:8000/api/inspect-csv', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('API Error');
                const data = await response.json();
                state.updateNodeData(nodeId, { status: 'Success', info: data });
            } catch (error) {
                state.updateNodeData(nodeId, { status: 'Failed to connect to backend' });
            }
        }

        if (targetNode.type === 'plotNode') {
            const plotData = targetNode.data as PlotNodeData;
            if (!plotData.columnX && plotData.plotType !== 'corr') {
                state.updateNodeData(nodeId, { status: 'Awaiting column name...' });
                return;
            }
            state.updateNodeData(nodeId, { status: 'Generating plot...', image: undefined });
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('plot_type', plotData.plotType || 'hist');
                if (plotData.columnX) formData.append('column_x', plotData.columnX);
                if (plotData.columnY) formData.append('column_y', plotData.columnY);

                const response = await fetch('http://localhost:8000/api/plot-column', { method: 'POST', body: formData });
                if (!response.ok) throw new Error('API Error');
                const data = await response.json();
                state.updateNodeData(nodeId, { status: 'Success', image: data.image });
            } catch (error) {
                state.updateNodeData(nodeId, { status: 'Plot generation failed' });
            }
        }
    }
}));

export default useStore;
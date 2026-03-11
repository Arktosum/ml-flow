import {
  useMemo,
  useState,
  useCallback,
  MouseEvent as ReactMouseEvent,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import type { NodeTypes } from "reactflow";
import "reactflow/dist/style.css";

import CsvNode from "./components/CsvNode";
import DataInspectNode from "./components/DataInspectNode";
import PlotNode from "./components/PlotNode";
import useStore from "./store";

type ContextMenuProps = {
  x: number;
  y: number;
  top: number;
  left: number;
};

function FlowCanvas() {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      csvInput: CsvNode,
      dataInspect: DataInspectNode,
      plotNode: PlotNode,
    }),
    [],
  );

  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const addNode = useStore((state) => state.addNode);

  const { screenToFlowPosition } = useReactFlow();
  const [menu, setMenu] = useState<ContextMenuProps | null>(null);

  // Replaced onPaneDoubleClick with a smart onPaneClick handler
  const onPaneClick = useCallback(
    (event: ReactMouseEvent) => {
      // detail === 2 means it was a double-click
      if (event.detail === 2) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        setMenu({
          x: position.x,
          y: position.y,
          top: event.clientY,
          left: event.clientX,
        });
      } else {
        // Single click simply closes the menu if it's open
        setMenu(null);
      }
    },
    [screenToFlowPosition],
  );

  // Optional: Also allow Right-Click to open the menu (like ComfyUI)
  const onPaneContextMenu = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setMenu({
        x: position.x,
        y: position.y,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [screenToFlowPosition],
  );

  const handleAddNode = (type: string) => {
    if (menu) {
      addNode(type, { x: menu.x, y: menu.y });
      setMenu(null);
    }
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", backgroundColor: "#111827" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#374151" gap={16} />
        <Controls />
      </ReactFlow>

      {menu && (
        <div
          className="absolute z-50 bg-[#1e1e1e] border border-[#444] shadow-2xl rounded-md w-48 overflow-hidden font-sans text-sm"
          style={{ top: menu.top, left: menu.left }}
        >
          <div className="bg-[#2a2a2a] px-3 py-1 border-b border-[#444] text-xs font-bold text-gray-400 uppercase tracking-wider">
            Add Node
          </div>
          <button
            onClick={() => handleAddNode("csvInput")}
            className="w-full text-left px-4 py-2 text-gray-200 hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            CSV Loader
          </button>
          <button
            onClick={() => handleAddNode("dataInspect")}
            className="w-full text-left px-4 py-2 text-gray-200 hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Data Inspect
          </button>
          <button
            onClick={() => handleAddNode("plotNode")}
            className="w-full text-left px-4 py-2 text-gray-200 hover:bg-purple-600 transition-colors cursor-pointer"
          >
            Dynamic Plot
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}

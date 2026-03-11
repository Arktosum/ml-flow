import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { BarChart3, Play } from "lucide-react";
import useStore from "../store";

export type PlotNodeData = {
  status?: string;
  image?: string;
  plotType?: string;
  columnX?: string;
  columnY?: string;
  availableColumns?: string[];
};

export default function PlotNode({ id, data }: NodeProps<PlotNodeData>) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const executeNode = useStore((state) => state.executeNode);

  const isBivariate = ["scatter", "box"].includes(data.plotType || "hist");
  const datalistId = `cols-${id}`;

  const handleConfigChange = (key: string, value: string) => {
    updateNodeData(id, { [key]: value });
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl min-w-[320px] font-sans overflow-hidden">
      <div className="bg-purple-600 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-white" />
          <span className="font-semibold text-white text-xs tracking-wide uppercase">
            Dynamic Plot
          </span>
        </div>
        <button
          onClick={() => executeNode(id)}
          className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white p-1 rounded-md border border-purple-400 transition-colors cursor-pointer"
        >
          <Play size={14} className="text-purple-300" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Plot Type</label>
          <select
            className="bg-[#2a2a2a] border border-[#444] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
            value={data.plotType || "hist"}
            onChange={(e) => handleConfigChange("plotType", e.target.value)}
          >
            <option value="hist">Histogram (1D)</option>
            <option value="scatter">Scatter Plot (2D)</option>
            <option value="box">Box Plot (2D)</option>
            <option value="corr">Correlation Heatmap (All Numeric)</option>
          </select>

          {data.availableColumns && (
            <datalist id={datalistId}>
              {data.availableColumns.map((col) => (
                <option key={col} value={col} />
              ))}
            </datalist>
          )}

          {data.plotType !== "corr" && (
            <input
              type="text"
              list={datalistId}
              placeholder="X-Axis Column"
              className="bg-[#2a2a2a] border border-[#444] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              value={data.columnX || ""}
              onChange={(e) => handleConfigChange("columnX", e.target.value)}
            />
          )}

          {isBivariate && (
            <input
              type="text"
              list={datalistId}
              placeholder="Y-Axis Column (Optional for Box)"
              className="bg-[#2a2a2a] border border-[#444] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
              value={data.columnY || ""}
              onChange={(e) => handleConfigChange("columnY", e.target.value)}
            />
          )}
        </div>

        {!data?.image ? (
          <div className="bg-[#2a2a2a] rounded p-3 border border-[#444] text-center min-h-[150px] flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono">
              {data?.status || "Waiting for config..."}
            </span>
          </div>
        ) : (
          <div className="bg-[#2a2a2a] rounded border border-[#444] overflow-hidden flex justify-center items-center p-2 min-h-[200px]">
            <img
              src={data.image}
              alt="Data Plot"
              className="max-w-full h-auto"
            />
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-[#1e1e1e]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-[#1e1e1e]"
      />
    </div>
  );
}

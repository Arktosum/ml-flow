import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { Eye, TableProperties } from "lucide-react";

export type InspectInfo = {
  filename: string;
  rows: number;
  columns: number;
  memory_usage_mb: number;
  schema: Record<string, string>;
};

export type DataInspectNodeData = {
  status?: string;
  info?: InspectInfo;
};

export default function DataInspectNode({
  data,
}: NodeProps<DataInspectNodeData>) {
  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl min-w-[260px] max-w-[300px] font-sans overflow-hidden">
      <div className="bg-blue-600 px-4 py-2 flex items-center gap-2">
        <Eye size={16} className="text-white" />
        <span className="font-semibold text-white text-xs tracking-wide uppercase">
          Data Inspect
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {!data?.info ? (
          <div className="bg-[#2a2a2a] rounded p-3 border border-[#444] text-center min-h-[60px] flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono">
              {data?.status || "Waiting for connection..."}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[#2a2a2a] p-2 rounded border border-[#444]">
              <span className="text-gray-400 text-xs">Shape:</span>
              <span className="text-blue-400 text-xs font-mono font-bold">
                {data.info.rows} × {data.info.columns}
              </span>
            </div>

            <div className="bg-[#2a2a2a] border border-[#444] rounded overflow-hidden">
              <div className="bg-[#333] px-2 py-1 flex items-center gap-2 border-b border-[#444]">
                <TableProperties size={12} className="text-gray-300" />
                <span className="text-gray-300 text-[10px] uppercase font-bold tracking-wider">
                  Schema
                </span>
              </div>
              <div className="max-h-[120px] overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                {Object.entries(data.info.schema).map(([col, dtype]) => (
                  <div
                    key={col}
                    className="flex justify-between items-center text-xs font-mono"
                  >
                    <span
                      className="text-gray-200 truncate max-w-[120px]"
                      title={col}
                    >
                      {col}
                    </span>
                    <span className="text-emerald-400 text-[10px]">
                      {dtype}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-[#1e1e1e]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-[#1e1e1e]"
      />
    </div>
  );
}

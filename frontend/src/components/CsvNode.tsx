import { useRef } from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { Database, FileUp } from "lucide-react";
import useStore from "../store";

export type CsvNodeData = {
  file?: File | null;
};

export default function CsvNode({ id, data }: NodeProps<CsvNodeData>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateNodeData(id, { file });
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl min-w-[240px] font-sans overflow-hidden">
      <div className="bg-emerald-600 px-4 py-2 flex items-center gap-2">
        <Database size={16} className="text-white" />
        <span className="font-semibold text-white text-xs tracking-wide uppercase">
          CSV Loader
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />

        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full bg-[#2a2a2a] hover:bg-[#333] border border-[#444] transition-colors rounded-md py-2 px-3 text-gray-200 text-sm cursor-pointer"
        >
          <FileUp size={16} />
          {data?.file ? "Change File" : "Browse Files"}
        </button>

        {data?.file && (
          <div className="bg-[#e0e0e0] rounded p-2 text-center border border-gray-400">
            <span className="text-black text-xs font-mono truncate block w-full">
              {data.file.name}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-500 border-2 border-[#1e1e1e]"
      />
    </div>
  );
}

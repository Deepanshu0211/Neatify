type OptionsPanelProps = {
  method: string;
  setMethod: (method: string) => void;
};

export default function OptionsPanel({}: OptionsPanelProps) {
  return (
    <div
      className="w-full max-w-md p-4 rounded-2xl 
                 bg-black/20 backdrop-blur-md 
                 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
    >
      <h2 className="text-xl font-bold text-white/70 mb-3 font-pixel text-center">
        Organizing Option
      </h2>

      {/* Options container */}
      <div className="flex items-center justify-center gap-6">
        {/* File Type Option */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg 
                             bg-black/30 backdrop-blur-sm 
                             border border-white/10 
                             hover:bg-black/40 hover:border-white/20 
                             transition">
            📂 <span className="font-medium text-white/90">By File Type</span>
          </button>
          {/* Active Badge */}
          <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 
                           bg-green-400/20 text-green-300 
                           border border-green-400/40 
                           backdrop-blur-md 
                           rounded-full shadow-sm">
            Active
          </span>
        </div>

        {/* AI Suggestions Option */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg 
                             bg-black/30 backdrop-blur-sm 
                             border border-white/10 
                             hover:bg-black/40 hover:border-white/20 
                             transition">
            🤖 <span className="font-medium text-white/70">AI Suggestions</span>
          </button>
          {/* Hover-only Coming Soon Badge */}
          <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 
                           bg-gray-400/20 text-gray-200 
                           border border-gray-400/40 
                           backdrop-blur-md 
                           rounded-full shadow-sm 
                           opacity-0 group-hover:opacity-100 transition">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}

type OptionsPanelProps = {
  method: string;
  setMethod: (method: string) => void;
};

export default function OptionsPanel({ }: OptionsPanelProps) {
  return (
    <div className="w-full max-w-md p-4 rounded-2xl 
                    bg-black/20 backdrop-blur-md 
                    border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
      
      <h2 className="text-xl font-bold text-white mb-3 font-pixel text-center">
        Organizing Option
      </h2>

      <div className="flex items-center gap-2 p-3 rounded-lg 
                      bg-black/10 backdrop-blur-sm 
                      border border-white/10 text-gray-200 cursor-default">
        📦 <span className="font-medium">By File Type</span>
      </div>

      <p className="mt-2 text-gray-400 text-xs text-center">
        Groups files into categories like Documents, Media, Apps, etc.
      </p>
    </div>
  );
}

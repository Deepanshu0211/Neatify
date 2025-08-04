type OptionsPanelProps = {
  method: string;
  setMethod: (method: string) => void;
};

export default function OptionsPanel({ }: OptionsPanelProps) {
  return (
   <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl shadow border border-gray-700 w-full max-w-md">
  <h2 className="text-xl font-bold text-indigo-400 mb-3 font-pixel text-center">
    Organizing Option
  </h2>

  <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-600 border border-indigo-400 text-white shadow">
    📦 <span className="font-medium">By File Type</span>
  </div>

  <p className="mt-2 text-gray-400 text-xs text-center">
    Groups files into categories like Documents, Media, Apps, etc.
  </p>
</div>

  );
}

type OptionsPanelProps = {
  method: string;
  setMethod: (method: string) => void;
};

export default function OptionsPanel({ method, setMethod }: OptionsPanelProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700 w-full">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4 font-pixel">Organizing Option</h2>

      <label
        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
          method === "extension"
            ? "bg-indigo-600 text-white"
            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
        }`}
      >
        <input
          type="radio"
          name="method"
          value="extension"
          checked={method === "extension"}
          onChange={(e) => setMethod(e.target.value)}
          className="accent-indigo-500"
        />
        <span className="text-sm font-semibold">📦 Organize by File Extension</span>
      </label>
    </div>
  );
}

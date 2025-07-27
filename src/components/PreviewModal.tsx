export default function PreviewModal({ previewData, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg w-2/3 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Preview Changes</h2>
        <div className="space-y-3">
          {Object.entries(previewData).map(([folder, files]: any) => (
            <div key={folder}>
              <p className="font-semibold">{folder}</p>
              <ul className="ml-4 list-disc">
                {files.map((file: string) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}

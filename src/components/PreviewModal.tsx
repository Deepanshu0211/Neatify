import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

export default function FilePreviewer() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const handleBrowse = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "All Files", extensions: ["*"] },
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] },
          { name: "Text", extensions: ["txt", "md", "json"] },
        ],
      });

      if (selected && typeof selected === "string") {
        setFilePath(selected);

        // simple preview logic
        if (selected.endsWith(".png") || selected.endsWith(".jpg") || selected.endsWith(".jpeg") || selected.endsWith(".gif")) {
          setPreviewContent("image");
        } else if (selected.endsWith(".txt") || selected.endsWith(".md") || selected.endsWith(".json")) {
          const text = await readTextFile(selected);
          setPreviewContent(text.slice(0, 500)); // preview first 500 chars
        } else {
          setPreviewContent("unsupported");
        }
      }
    } catch (err) {
      console.error("Error selecting file:", err);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <button
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        onClick={handleBrowse}
      >
        Browse
      </button>

      {/* Modal Preview */}
      {filePath && (
        <div className="mt-6 p-6 bg-gray-900 text-white rounded-2xl w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">File Preview</h2>
            <button onClick={() => { setFilePath(null); setPreviewContent(null); }}>✕</button>
          </div>

          {previewContent === "image" ? (
            <img src={`tauri://localhost/${filePath}`} alt="Preview" className="rounded-lg max-h-64 object-contain" />
          ) : previewContent === "unsupported" ? (
            <p>No preview available for this file type</p>
          ) : previewContent ? (
            <pre className="whitespace-pre-wrap bg-gray-800 p-3 rounded-lg max-h-64 overflow-y-auto">
              {previewContent}
            </pre>
          ) : (
            <p>No preview data available</p>
          )}
        </div>
      )}
    </div>
  );
}

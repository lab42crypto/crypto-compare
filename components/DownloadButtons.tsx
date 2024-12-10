interface DownloadButtonsProps {
  onDownloadAll: () => Promise<void>;
  onDownloadTable: () => Promise<void>;
  onDownloadCharts: () => Promise<void>;
}

export default function DownloadButtons({
  onDownloadAll,
  onDownloadTable,
  onDownloadCharts,
}: DownloadButtonsProps) {
  return (
    <div className="flex justify-end mb-4 gap-2">
      <button
        onClick={onDownloadAll}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
      >
        <i className="fas fa-download"></i>
        Download All
      </button>
      <button
        onClick={onDownloadTable}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
      >
        <i className="fas fa-download"></i>
        Download Table
      </button>
      <button
        onClick={onDownloadCharts}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
      >
        <i className="fas fa-download"></i>
        Download Charts
      </button>
    </div>
  );
}

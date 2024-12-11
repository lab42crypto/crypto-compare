export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <p className="text-lg font-semibold text-gray-700">
          Fetching token data...
        </p>
        <p className="text-sm text-gray-500">This may take a few moments</p>
      </div>
    </div>
  );
}

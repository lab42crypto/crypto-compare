export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-10 h-10">
        {/* Outer ring */}
        <div className="absolute w-full h-full border-4 border-blue-200 rounded-full"></div>
        {/* Spinning ring */}
        <div className="absolute w-full h-full border-4 border-blue-500 rounded-full animate-spin-gradient"></div>
        {/* Inner dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  );
}

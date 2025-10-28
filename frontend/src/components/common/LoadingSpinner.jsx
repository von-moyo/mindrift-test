const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;

export default function LoadingSpinner({ fullScreen = false, text = '加载中...' }) {
    const content = (
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 animate-spin">
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        </div>
        {text && <p className="mt-3 text-gray-500 text-sm">{text}</p>}
      </div>
    );
  
    if (fullScreen) {
      return (
        <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
          {content}
        </div>
      );
    }
  
    return content;
  }
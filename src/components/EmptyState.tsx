interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
  }
  
  export default function EmptyState({ icon, title, description, actionText, onAction }: EmptyStateProps) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 animate-bounce">{icon}</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }
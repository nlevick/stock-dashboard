import { Button } from '@/components/ui/Button';
import type { ApiError } from '@/types/error';

interface DataStatusProps {
  loading: boolean;
  error: ApiError | null;
  empty: boolean;
  emptyMessage: string;
  errorLabel: string;
  retry: () => void;
  retryLabel?: string;
}

export function DataStatus({
  loading,
  error,
  empty,
  emptyMessage,
  errorLabel,
  retry,
  retryLabel = 'Retry',
}: DataStatusProps) {
  if (loading) {
    return (
      <p className="data-status data-status-loading" role="status">
        Loading...
      </p>
    );
  }
  if (!error && !empty) return null;

  return (
    <div className="data-status">
      <p role={error ? 'alert' : 'status'}>
        {error ? `${errorLabel}. ${error.message}` : emptyMessage}
      </p>
      <Button className="dashboard-button" onClick={retry}>
        {retryLabel}
      </Button>
    </div>
  );
}

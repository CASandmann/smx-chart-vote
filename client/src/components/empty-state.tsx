import { Music2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-results" | "error";
  onClearFilters?: () => void;
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  if (type === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Music2 className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Unable to Load Charts</h3>
        <p className="text-muted-foreground max-w-sm">
          We couldn't fetch the chart data. Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Charts Found</h3>
      <p className="text-muted-foreground max-w-sm mb-4">
        No charts match your current search or filter criteria.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters} data-testid="button-clear-all-filters">
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

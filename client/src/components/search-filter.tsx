import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  difficultyFilters: string[];
  onDifficultyFiltersChange: (value: string[]) => void;
  minDifficulty: number;
  maxDifficulty: number;
  onDifficultyRangeChange: (min: number, max: number) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showMyVotesOnly: boolean;
  onShowMyVotesChange: (value: boolean) => void;
  isAuthenticated: boolean;
}

const difficultyTypes = [
  { value: "basic", label: "Basic" },
  { value: "easy", label: "Easy" },
  { value: "easy2", label: "Easy+" },
  { value: "hard", label: "Hard" },
  { value: "hard2", label: "Hard+" },
  { value: "wild", label: "Wild" },
  { value: "full", label: "Full" },
  { value: "full2", label: "Full+" },
  { value: "dual", label: "Dual" },
  { value: "dual2", label: "Dual+" },
];

const difficultyColors: Record<string, string> = {
  basic: "bg-green-400 dark:bg-green-500 text-white",
  easy: "bg-yellow-400 dark:bg-yellow-500 text-black",
  easy2: "bg-yellow-400 dark:bg-yellow-500 text-black",
  hard: "bg-red-500 dark:bg-red-600 text-white",
  hard2: "bg-red-500 dark:bg-red-600 text-white",
  wild: "bg-purple-500 dark:bg-purple-600 text-white",
  full: "bg-teal-400 dark:bg-teal-500 text-white",
  full2: "bg-teal-400 dark:bg-teal-500 text-white",
  dual: "bg-blue-400 dark:bg-blue-500 text-white",
  dual2: "bg-blue-400 dark:bg-blue-500 text-white",
};

export function SearchFilter({
  searchQuery,
  onSearchChange,
  difficultyFilters,
  onDifficultyFiltersChange,
  minDifficulty,
  maxDifficulty,
  onDifficultyRangeChange,
  sortBy,
  onSortChange,
  showMyVotesOnly,
  onShowMyVotesChange,
  isAuthenticated,
}: SearchFilterProps) {
  const hasActiveFilters = difficultyFilters.length > 0 || minDifficulty > 1 || maxDifficulty < 28 || showMyVotesOnly;

  const toggleDifficultyFilter = (value: string) => {
    if (difficultyFilters.includes(value)) {
      onDifficultyFiltersChange(difficultyFilters.filter(f => f !== value));
    } else {
      onDifficultyFiltersChange([...difficultyFilters, value]);
    }
  };

  const removeDifficultyFilter = (value: string) => {
    onDifficultyFiltersChange(difficultyFilters.filter(f => f !== value));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search songs or artists..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Most Votes</SelectItem>
              <SelectItem value="difficulty-asc">Difficulty (Low)</SelectItem>
              <SelectItem value="difficulty-desc">Difficulty (High)</SelectItem>
              <SelectItem value="plays">Most Played</SelectItem>
              <SelectItem value="pass-rate-desc">Pass Rate (High)</SelectItem>
              <SelectItem value="pass-rate-asc">Pass Rate (Low)</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className={hasActiveFilters ? "border-primary text-primary" : ""}
                data-testid="button-filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Difficulty Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {difficultyTypes.map((dt) => (
                      <div key={dt.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${dt.value}`}
                          checked={difficultyFilters.includes(dt.value)}
                          onCheckedChange={() => toggleDifficultyFilter(dt.value)}
                          data-testid={`checkbox-difficulty-${dt.value}`}
                        />
                        <label
                          htmlFor={`filter-${dt.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {dt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty Range: {minDifficulty} - {maxDifficulty}</Label>
                  <div className="pt-2 px-1">
                    <Slider
                      min={1}
                      max={28}
                      step={1}
                      value={[minDifficulty, maxDifficulty]}
                      onValueChange={([min, max]) => onDifficultyRangeChange(min, max)}
                      data-testid="slider-difficulty-range"
                    />
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Checkbox
                      id="filter-my-votes"
                      checked={showMyVotesOnly}
                      onCheckedChange={(checked) => onShowMyVotesChange(checked === true)}
                      data-testid="checkbox-my-votes"
                    />
                    <label
                      htmlFor="filter-my-votes"
                      className="text-sm cursor-pointer"
                    >
                      Show my votes only
                    </label>
                  </div>
                )}

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDifficultyFiltersChange([]);
                      onDifficultyRangeChange(1, 28);
                      onShowMyVotesChange(false);
                    }}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {difficultyFilters.map((filter) => (
            <Badge 
              key={filter}
              variant="secondary" 
              className={`gap-1 border border-border ${difficultyColors[filter] || ""}`}
              data-testid={`badge-filter-${filter}`}
            >
              {difficultyTypes.find(d => d.value === filter)?.label}
              <button 
                onClick={() => removeDifficultyFilter(filter)}
                className="ml-1"
                data-testid={`button-remove-filter-${filter}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {(minDifficulty > 1 || maxDifficulty < 28) && (
            <Badge 
              variant="outline" 
              className="gap-1 border !border-border bg-white dark:bg-gray-100 text-black"
              data-testid="badge-difficulty-range-filter"
            >
              Level {minDifficulty}-{maxDifficulty}
              <button 
                onClick={() => onDifficultyRangeChange(1, 28)}
                className="ml-1"
                data-testid="button-remove-range-filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {showMyVotesOnly && (
            <Badge 
              variant="secondary" 
              className="gap-1 border border-border bg-primary text-primary-foreground"
              data-testid="badge-my-votes-filter"
            >
              My Votes
              <button 
                onClick={() => onShowMyVotesChange(false)}
                className="ml-1"
                data-testid="button-remove-my-votes-filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

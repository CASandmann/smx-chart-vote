import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  difficultyFilter: string;
  onDifficultyFilterChange: (value: string) => void;
  minDifficulty: number;
  maxDifficulty: number;
  onDifficultyRangeChange: (min: number, max: number) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

const difficultyTypes = [
  { value: "all", label: "All Difficulties" },
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

export function SearchFilter({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyFilterChange,
  minDifficulty,
  maxDifficulty,
  onDifficultyRangeChange,
  sortBy,
  onSortChange,
}: SearchFilterProps) {
  const hasActiveFilters = difficultyFilter !== "all" || minDifficulty > 1 || maxDifficulty < 28;

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
              <SelectItem value="pass-rate">Pass Rate</SelectItem>
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
                <div className="space-y-2">
                  <Label>Difficulty Type</Label>
                  <Select value={difficultyFilter} onValueChange={onDifficultyFilterChange}>
                    <SelectTrigger data-testid="select-difficulty-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyTypes.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDifficultyFilterChange("all");
                      onDifficultyRangeChange(1, 28);
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
          {difficultyFilter !== "all" && (
            <Badge 
              variant="secondary" 
              className="gap-1"
              data-testid="badge-difficulty-type-filter"
            >
              {difficultyTypes.find(d => d.value === difficultyFilter)?.label}
              <button 
                onClick={() => onDifficultyFilterChange("all")}
                className="ml-1"
                data-testid="button-remove-difficulty-filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(minDifficulty > 1 || maxDifficulty < 28) && (
            <Badge 
              variant="secondary" 
              className="gap-1"
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
        </div>
      )}
    </div>
  );
}

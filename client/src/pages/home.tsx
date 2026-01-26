import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChartCard } from "@/components/chart-card";
import { ChartListSkeleton } from "@/components/chart-skeleton";
import { SearchFilter } from "@/components/search-filter";
import { StatsHeader } from "@/components/stats-header";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChartWithSong, VoteCount } from "@shared/schema";
import { Music2 } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(28);
  const [sortBy, setSortBy] = useState("votes");

  const { data: charts, isLoading: chartsLoading, isError: chartsError } = useQuery<ChartWithSong[]>({
    queryKey: ["/api/charts"],
  });

  const { data: voteCounts, isLoading: votesLoading } = useQuery<VoteCount[]>({
    queryKey: ["/api/votes"],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ chartId, voteType }: { chartId: number; voteType: "up" | "down" }) => {
      return apiRequest("POST", "/api/votes", { chartId, voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
    },
    onError: () => {
      toast({
        title: "Vote Failed",
        description: "Unable to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = useCallback((chartId: number, voteType: "up" | "down") => {
    voteMutation.mutate({ chartId, voteType });
  }, [voteMutation]);

  const handleDifficultyRangeChange = useCallback((min: number, max: number) => {
    setMinDifficulty(min);
    setMaxDifficulty(max);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setMinDifficulty(1);
    setMaxDifficulty(28);
  }, []);

  const voteCountMap = useMemo(() => {
    const map = new Map<number, VoteCount>();
    voteCounts?.forEach((vc) => map.set(vc.chartId, vc));
    return map;
  }, [voteCounts]);

  const filteredAndSortedCharts = useMemo(() => {
    if (!charts) return [];

    let result = charts.filter((chart) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        chart.song.title.toLowerCase().includes(query) ||
        chart.song.artist.toLowerCase().includes(query);
      
      const matchesDifficultyType = difficultyFilter === "all" || 
        chart.difficulty_name === difficultyFilter;
      
      const matchesDifficultyRange = chart.difficulty >= minDifficulty && 
        chart.difficulty <= maxDifficulty;

      return matchesSearch && matchesDifficultyType && matchesDifficultyRange;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "votes": {
          const aVotes = voteCountMap.get(a.id);
          const bVotes = voteCountMap.get(b.id);
          const aNet = (aVotes?.upvotes ?? 0) - (aVotes?.downvotes ?? 0);
          const bNet = (bVotes?.upvotes ?? 0) - (bVotes?.downvotes ?? 0);
          return bNet - aNet;
        }
        case "difficulty-asc":
          return a.difficulty - b.difficulty;
        case "difficulty-desc":
          return b.difficulty - a.difficulty;
        case "plays":
          return b.play_count - a.play_count;
        case "title":
          return a.song.title.localeCompare(b.song.title);
        default:
          return 0;
      }
    });

    return result;
  }, [charts, searchQuery, difficultyFilter, minDifficulty, maxDifficulty, sortBy, voteCountMap]);

  const totalVotes = useMemo(() => {
    if (!voteCounts) return 0;
    return voteCounts.reduce((sum, vc) => sum + vc.upvotes + vc.downvotes, 0);
  }, [voteCounts]);

  const uniqueSongCount = useMemo(() => {
    if (!charts) return 0;
    const songIds = new Set(charts.map(c => c.song_id));
    return songIds.size;
  }, [charts]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="difficulty-gradient p-2 rounded-md">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SMX Chart Voter</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Vote on chart difficulty ratings
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <StatsHeader
          totalCharts={charts?.length ?? 0}
          totalSongs={uniqueSongCount}
          totalVotes={totalVotes}
          isLoading={chartsLoading || votesLoading}
        />

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          difficultyFilter={difficultyFilter}
          onDifficultyFilterChange={setDifficultyFilter}
          minDifficulty={minDifficulty}
          maxDifficulty={maxDifficulty}
          onDifficultyRangeChange={handleDifficultyRangeChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="pb-8">
          {chartsLoading ? (
            <ChartListSkeleton />
          ) : chartsError ? (
            <EmptyState type="error" />
          ) : filteredAndSortedCharts.length === 0 ? (
            <EmptyState type="no-results" onClearFilters={clearAllFilters} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedCharts.length} of {charts?.length ?? 0} charts
              </p>
              <div className="grid gap-3">
                {filteredAndSortedCharts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    voteData={voteCountMap.get(chart.id)}
                    onVote={handleVote}
                    isPending={voteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

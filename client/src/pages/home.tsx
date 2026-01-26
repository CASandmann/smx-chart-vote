import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChartCard } from "@/components/chart-card";
import { ChartListSkeleton } from "@/components/chart-skeleton";
import { SearchFilter } from "@/components/search-filter";
import { StatsHeader } from "@/components/stats-header";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { ChartWithSong, VoteCount } from "@shared/schema";
import { Music2, LogIn, LogOut } from "lucide-react";

const ITEMS_PER_PAGE = 100;

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(28);
  const [sortBy, setSortBy] = useState("votes");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login Required",
          description: "Please log in to vote on charts.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Vote Failed",
        description: "Unable to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = useCallback((chartId: number, voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to vote on charts.",
        variant: "destructive",
      });
      return;
    }
    voteMutation.mutate({ chartId, voteType });
  }, [voteMutation, isAuthenticated, toast]);

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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, difficultyFilter, minDifficulty, maxDifficulty, sortBy]);

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
          // Sort by absolute value - negative votes are still votes
          return Math.abs(bNet) - Math.abs(aNet);
        }
        case "difficulty-asc":
          return a.difficulty - b.difficulty;
        case "difficulty-desc":
          return b.difficulty - a.difficulty;
        case "plays":
          return b.play_count - a.play_count;
        case "pass-rate-desc": {
          const aRate = a.play_count > 0 ? a.pass_count / a.play_count : 0;
          const bRate = b.play_count > 0 ? b.pass_count / b.play_count : 0;
          return bRate - aRate;
        }
        case "pass-rate-asc": {
          const aRate = a.play_count > 0 ? a.pass_count / a.play_count : 0;
          const bRate = b.play_count > 0 ? b.pass_count / b.play_count : 0;
          return aRate - bRate;
        }
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

  // Get visible charts (lazy loaded)
  const visibleCharts = useMemo(() => {
    return filteredAndSortedCharts.slice(0, visibleCount);
  }, [filteredAndSortedCharts, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedCharts.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredAndSortedCharts.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, filteredAndSortedCharts.length]);

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
            <div className="flex items-center gap-2">
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:inline">{user.firstName || user.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    data-testid="button-logout"
                  >
                    <a href="/api/logout">
                      <LogOut className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <Button asChild data-testid="button-login">
                  <a href="/api/login" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </a>
                </Button>
              )}
              <ThemeToggle />
            </div>
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
              <p className="text-sm text-muted-foreground" data-testid="text-showing-count">
                Showing {visibleCharts.length} of {filteredAndSortedCharts.length} charts
                {filteredAndSortedCharts.length !== (charts?.length ?? 0) && 
                  ` (filtered from ${charts?.length ?? 0})`}
              </p>
              <div className="grid gap-3">
                {visibleCharts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    voteData={voteCountMap.get(chart.id)}
                    onVote={handleVote}
                    isPending={voteMutation.isPending}
                  />
                ))}
              </div>
              {hasMore && (
                <div 
                  ref={loadMoreRef} 
                  className="flex justify-center py-8"
                  data-testid="load-more-trigger"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading more charts...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

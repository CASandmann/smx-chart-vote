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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { ChartWithSong, VoteCount } from "@shared/schema";
import { Music2, LogIn, LogOut } from "lucide-react";
import { SuggestionDialog } from "@/components/suggestion-dialog";

const SLOW_REQUEST_MS = 3000;

const ITEMS_PER_PAGE = 100;

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [minDifficulty, setMinDifficulty] = useState(1);
  const [maxDifficulty, setMaxDifficulty] = useState(28);
  const [sortBy, setSortBy] = useState("title");
  const [showMyVotesOnly, setShowMyVotesOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: charts,
    isLoading: chartsLoading,
    isError: chartsError,
  } = useQuery<ChartWithSong[]>({
    queryKey: ["/api/charts"],
  });

  const { data: voteCounts, isLoading: votesLoading } = useQuery<VoteCount[]>({
    queryKey: ["/api/votes"],
  });

  const [pendingChartIds, setPendingChartIds] = useState<Set<number>>(
    new Set(),
  );

  const voteMutation = useMutation({
    mutationFn: async ({
      chartId,
      voteType,
    }: {
      chartId: number;
      voteType: "up" | "down";
    }) => {
      return apiRequest("POST", "/api/votes", { chartId, voteType });
    },
    onMutate: async ({ chartId, voteType }) => {
      setPendingChartIds((prev) => new Set(prev).add(chartId));

      const slowTimer = setTimeout(() => {
        toast({
          title: "Saving your vote...",
          description: "The server is waking up. This may take a moment.",
        });
      }, SLOW_REQUEST_MS);

      await queryClient.cancelQueries({ queryKey: ["/api/votes"] });

      const previousVotes = queryClient.getQueryData<VoteCount[]>([
        "/api/votes",
      ]);

      queryClient.setQueryData<VoteCount[]>(["/api/votes"], (old) => {
        if (!old) return old;
        const existing = old.find((vc) => vc.chartId === chartId);
        if (existing) {
          const prev = existing.userVote;
          if (prev === voteType) {
            return old.map((vc) =>
              vc.chartId === chartId
                ? {
                    ...vc,
                    upvotes: vc.upvotes - (voteType === "up" ? 1 : 0),
                    downvotes: vc.downvotes - (voteType === "down" ? 1 : 0),
                    userVote: null,
                  }
                : vc,
            );
          }
          return old.map((vc) =>
            vc.chartId === chartId
              ? {
                  ...vc,
                  upvotes:
                    vc.upvotes +
                    (voteType === "up" ? 1 : 0) -
                    (prev === "up" ? 1 : 0),
                  downvotes:
                    vc.downvotes +
                    (voteType === "down" ? 1 : 0) -
                    (prev === "down" ? 1 : 0),
                  userVote: voteType,
                }
              : vc,
          );
        }
        return [
          ...old,
          {
            chartId,
            upvotes: voteType === "up" ? 1 : 0,
            downvotes: voteType === "down" ? 1 : 0,
            userVote: voteType,
          },
        ];
      });

      return { previousVotes, slowTimer };
    },
    onSettled: (_data, _error, variables, context) => {
      setPendingChartIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.chartId);
        return next;
      });
      if (context?.slowTimer) {
        clearTimeout(context.slowTimer);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/votes"] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(["/api/votes"], context.previousVotes);
      }
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

  const handleVote = useCallback(
    (chartId: number, voteType: "up" | "down") => {
      if (!isAuthenticated) {
        toast({
          title: "Login Required",
          description: "Please log in to vote on charts.",
          variant: "destructive",
        });
        return;
      }
      voteMutation.mutate({ chartId, voteType });
    },
    [voteMutation, isAuthenticated, toast],
  );

  const handleDifficultyRangeChange = useCallback(
    (min: number, max: number) => {
      setMinDifficulty(min);
      setMaxDifficulty(max);
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilters([]);
    setMinDifficulty(1);
    setMaxDifficulty(28);
    setShowMyVotesOnly(false);
  }, []);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [
    searchQuery,
    difficultyFilters,
    minDifficulty,
    maxDifficulty,
    sortBy,
    showMyVotesOnly,
  ]);

  const voteCountMap = useMemo(() => {
    const map = new Map<number, VoteCount>();
    voteCounts?.forEach((vc) => map.set(vc.chartId, vc));
    return map;
  }, [voteCounts]);

  const filteredAndSortedCharts = useMemo(() => {
    if (!charts) return [];

    let result = charts.filter((chart) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        chart.song.title.toLowerCase().includes(query) ||
        chart.song.artist.toLowerCase().includes(query);

      const matchesDifficultyType =
        difficultyFilters.length === 0 ||
        difficultyFilters.includes(chart.difficulty_name);

      const matchesDifficultyRange =
        chart.difficulty >= minDifficulty && chart.difficulty <= maxDifficulty;

      const userVote = voteCountMap.get(chart.id);
      const matchesMyVotes =
        !showMyVotesOnly ||
        (userVote !== undefined && userVote.userVote !== null);

      return (
        matchesSearch &&
        matchesDifficultyType &&
        matchesDifficultyRange &&
        matchesMyVotes
      );
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
        case "date":
          return (b.song.date || "").localeCompare(a.song.date || "");
        case "title":
          return a.song.title.localeCompare(b.song.title);
        default:
          return 0;
      }
    });

    return result;
  }, [
    charts,
    searchQuery,
    difficultyFilters,
    minDifficulty,
    maxDifficulty,
    sortBy,
    showMyVotesOnly,
    voteCountMap,
  ]);

  const totalVotes = useMemo(() => {
    if (!voteCounts) return 0;
    return voteCounts.reduce((sum, vc) => sum + vc.upvotes + vc.downvotes, 0);
  }, [voteCounts]);

  const userVoteCount = useMemo(() => {
    if (!voteCounts) return 0;
    return voteCounts.filter((vc) => vc.userVote !== null).length;
  }, [voteCounts]);

  const uniqueSongCount = useMemo(() => {
    if (!charts) return 0;
    const songIds = new Set(charts.map((c) => c.song_id));
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
          setVisibleCount((prev) =>
            Math.min(prev + ITEMS_PER_PAGE, filteredAndSortedCharts.length),
          );
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
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
    <div className="min-h-screen min-w-fit bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="difficulty-gradient p-2 rounded-md">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">StepManiaX Chart Voter</h1>
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
                    <AvatarImage
                      src={user.profileImageUrl || undefined}
                      alt={user.firstName || "User"}
                    />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:inline">
                    {user.firstName || user.email}
                  </span>
                  <SuggestionDialog />
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Log out</p>
                    </TooltipContent>
                  </Tooltip>
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
          userVoteCount={userVoteCount}
          isLoading={chartsLoading || votesLoading}
        />

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          difficultyFilters={difficultyFilters}
          onDifficultyFiltersChange={setDifficultyFilters}
          minDifficulty={minDifficulty}
          maxDifficulty={maxDifficulty}
          onDifficultyRangeChange={handleDifficultyRangeChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showMyVotesOnly={showMyVotesOnly}
          onShowMyVotesChange={setShowMyVotesOnly}
          isAuthenticated={isAuthenticated}
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
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-showing-count"
              >
                Showing {visibleCharts.length} of{" "}
                {filteredAndSortedCharts.length} charts
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
                    isPending={pendingChartIds.has(chart.id)}
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

      <footer className="sticky bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-2">
        <div className="container mx-auto px-4 flex justify-center">
          <a
            href="https://www.patreon.com/c/ZOM585"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 leading-[19px]"
            data-testid="link-patreon"
          >
            <img
              src="https://c5.patreon.com/external/favicon/favicon-32x32.png"
              alt="Patreon"
              className="w-4 h-4"
            />
            Support this project on Patreon
          </a>
        </div>
      </footer>
    </div>
  );
}

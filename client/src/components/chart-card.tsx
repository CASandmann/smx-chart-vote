import { ChevronUp, ChevronDown, Music, Users, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChartWithSong, VoteCount } from "@shared/schema";

interface ChartCardProps {
  chart: ChartWithSong;
  voteData: VoteCount | undefined;
  onVote: (chartId: number, voteType: "up" | "down") => void;
  isPending: boolean;
}

const difficultyColors: Record<string, string> = {
  basic: "bg-green-400 dark:bg-green-500",      // Beginner - green (lighter)
  easy: "bg-yellow-400 dark:bg-yellow-500",     // Easy - yellow (lighter)
  easy2: "bg-yellow-400 dark:bg-yellow-500",    // Easy+ - same yellow
  hard: "bg-red-500 dark:bg-red-600",           // Hard - more vivid red
  hard2: "bg-red-500 dark:bg-red-600",          // Hard+ - same red
  wild: "bg-purple-500 dark:bg-purple-600",     // Wild - purple (unchanged)
  full: "bg-teal-400 dark:bg-teal-500",         // Full - green-turquoise
  full2: "bg-teal-400 dark:bg-teal-500",        // Full+ - same turquoise
  dual: "bg-blue-400 dark:bg-blue-500",         // Dual - blue (lighter)
  dual2: "bg-blue-400 dark:bg-blue-500",        // Dual+ - same blue
};

export function ChartCard({ chart, voteData, onVote, isPending }: ChartCardProps) {
  const upvotes = voteData?.upvotes ?? 0;
  const downvotes = voteData?.downvotes ?? 0;
  const userVote = voteData?.userVote ?? null;
  const netVotes = upvotes - downvotes;

  const difficultyColor = difficultyColors[chart.difficulty_name] ?? "bg-gray-500 dark:bg-gray-600";
  const coverUrl = chart.song.cover_thumb 
    ? `https://smx.573.no/${chart.song.cover_thumb}`
    : null;

  return (
    <Card className="overflow-visible hover-elevate active-elevate-2 transition-all duration-200">
      <div className="flex gap-4 p-4">
        <div className="relative flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={chart.song.title}
              className="w-20 h-20 rounded-md object-cover"
              data-testid={`img-cover-${chart.id}`}
            />
          ) : (
            <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <Badge 
            className={`absolute -bottom-2 -right-2 ${difficultyColor} text-white border-0`}
            data-testid={`badge-difficulty-${chart.id}`}
          >
            {chart.difficulty}
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-base truncate"
            data-testid={`text-title-${chart.id}`}
          >
            {chart.song.title}
          </h3>
          <p 
            className="text-sm text-muted-foreground truncate"
            data-testid={`text-artist-${chart.id}`}
          >
            {chart.song.artist}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge 
              variant="outline" 
              className="text-xs capitalize"
              data-testid={`badge-difficulty-name-${chart.id}`}
            >
              {chart.difficulty_display}
            </Badge>
            <span 
              className="text-xs text-muted-foreground flex items-center gap-1"
              data-testid={`text-plays-${chart.id}`}
            >
              <Users className="w-3 h-3" />
              {chart.play_count.toLocaleString()}
            </span>
            <span 
              className="text-xs text-muted-foreground flex items-center gap-1"
              data-testid={`text-passes-${chart.id}`}
            >
              <Trophy className="w-3 h-3" />
              {chart.pass_count.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={userVote === "up" ? "default" : "ghost"}
                size="icon"
                onClick={() => onVote(chart.id, "up")}
                disabled={isPending}
                className={userVote === "up" ? "toggle-elevate toggle-elevated" : ""}
                data-testid={`button-upvote-${chart.id}`}
              >
                <ChevronUp className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Should be harder</p>
            </TooltipContent>
          </Tooltip>
          <span 
            className={`text-sm font-bold ${
              netVotes > 0 ? "text-emerald-600 dark:text-emerald-400" : 
              netVotes < 0 ? "text-rose-600 dark:text-rose-400" : 
              "text-muted-foreground"
            }`}
            data-testid={`text-votes-${chart.id}`}
          >
            {netVotes > 0 ? "+" : ""}{netVotes}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={userVote === "down" ? "destructive" : "ghost"}
                size="icon"
                onClick={() => onVote(chart.id, "down")}
                disabled={isPending}
                className={userVote === "down" ? "toggle-elevate toggle-elevated" : ""}
                data-testid={`button-downvote-${chart.id}`}
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Should be easier</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}

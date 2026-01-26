import { Music, BarChart3, ThumbsUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsHeaderProps {
  totalCharts: number;
  totalSongs: number;
  totalVotes: number;
  isLoading: boolean;
}

export function StatsHeader({
  totalCharts,
  totalSongs,
  totalVotes,
  isLoading,
}: StatsHeaderProps) {
  const stats = [
    {
      label: "Total Charts",
      value: totalCharts,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Songs",
      value: totalSongs,
      icon: Music,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Votes Cast",
      value: totalVotes,
      icon: ThumbsUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="p-3"
          data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p
                className="text-xl font-bold"
                data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {isLoading ? "..." : stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { z } from "zod";
import type { Chart, Song, ChartWithSong } from "@shared/schema";

const voteSchema = z.object({
  chartId: z.number(),
  voteType: z.enum(["up", "down"]),
});

let cachedCharts: ChartWithSong[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchChartsWithSongs(): Promise<ChartWithSong[]> {
  const now = Date.now();
  if (cachedCharts && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCharts;
  }

  try {
    const [chartsRes, songsRes] = await Promise.all([
      fetch("https://smx.573.no/api/charts"),
      fetch("https://smx.573.no/api/songs"),
    ]);

    if (!chartsRes.ok || !songsRes.ok) {
      throw new Error("Failed to fetch data from SMX API");
    }

    const charts: Chart[] = await chartsRes.json();
    const songs: Song[] = await songsRes.json();

    const songMap = new Map<number, Song>();
    for (const song of songs) {
      songMap.set(song.id, song);
    }

    // Songs permanently removed from the game
    const removedSongs = new Set([
      "All It Takes",
      "Sinxorder",
      "Hurry Up!",
      "ChicaBomb",
    ]);

    // Filter out removed songs first
    const filteredCharts = charts.filter((chart) => {
      const song = songMap.get(chart.song_id);
      if (!song) return false;
      if (removedSongs.has(song.title)) return false;
      return true;
    });

    // Recalculate plus variants based on actual difficulty values
    // Group charts by song_id and base difficulty type
    const getBaseType = (name: string): string => {
      // Remove "2" suffix to get base type (e.g., "full2" -> "full")
      return name.replace(/2$/, "");
    };

    // Build a map of song_id -> base_type -> charts
    const songTypeMap = new Map<number, Map<string, Chart[]>>();
    for (const chart of filteredCharts) {
      const baseType = getBaseType(chart.difficulty_name);
      if (!songTypeMap.has(chart.song_id)) {
        songTypeMap.set(chart.song_id, new Map());
      }
      const typeMap = songTypeMap.get(chart.song_id)!;
      if (!typeMap.has(baseType)) {
        typeMap.set(baseType, []);
      }
      typeMap.get(baseType)!.push(chart);
    }

    // Create corrected charts with proper plus labels
    const chartsWithSongs: ChartWithSong[] = filteredCharts.map((chart) => {
      const baseType = getBaseType(chart.difficulty_name);
      const typeMap = songTypeMap.get(chart.song_id)!;
      const chartsOfType = typeMap.get(baseType)!;

      let correctedName = chart.difficulty_name;
      let correctedDisplay = chart.difficulty_display;

      // If there are exactly 2 charts of the same base type, recalculate labels
      if (chartsOfType.length === 2) {
        const [chart1, chart2] = chartsOfType.sort((a, b) => a.difficulty - b.difficulty);
        const isHigher = chart.id === chart2.id;

        if (isHigher) {
          // Higher difficulty gets the plus variant
          correctedName = baseType + "2";
          correctedDisplay = baseType + "+";
        } else {
          // Lower difficulty gets the base variant
          correctedName = baseType;
          correctedDisplay = baseType;
        }
      } else if (chartsOfType.length === 1) {
        // Only one chart of this type - use base name (no plus)
        correctedName = baseType;
        correctedDisplay = baseType;
      }

      return {
        ...chart,
        difficulty_name: correctedName,
        difficulty_display: correctedDisplay,
        song: songMap.get(chart.song_id)!,
      };
    });

    cachedCharts = chartsWithSongs;
    cacheTimestamp = now;

    return chartsWithSongs;
  } catch (error) {
    if (cachedCharts) {
      return cachedCharts;
    }
    throw error;
  }
}

function getUserId(req: any): string | null {
  return req.user?.claims?.sub ?? null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/charts", async (req, res) => {
    try {
      const charts = await fetchChartsWithSongs();
      res.json(charts);
    } catch (error) {
      console.error("Error fetching charts:", error);
      res.status(500).json({ error: "Failed to fetch charts" });
    }
  });

  app.get("/api/votes", async (req, res) => {
    try {
      const userId = getUserId(req);
      const voteCounts = await storage.getVoteCounts(userId || "");
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching votes:", error);
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  app.post("/api/votes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const parsed = voteSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vote data" });
      }

      const { chartId, voteType } = parsed.data;

      const vote = await storage.createOrUpdateVote({
        chartId,
        voteType,
        userId,
      });

      res.json(vote);
    } catch (error) {
      console.error("Error casting vote:", error);
      res.status(500).json({ error: "Failed to cast vote" });
    }
  });

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

    const chartsWithSongs: ChartWithSong[] = charts
      .filter((chart) => songMap.has(chart.song_id))
      .map((chart) => ({
        ...chart,
        song: songMap.get(chart.song_id)!,
      }));

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

function getSessionId(req: any): string {
  if (!req.session.visitorId) {
    req.session.visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  return req.session.visitorId;
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
      const sessionId = getSessionId(req);
      const voteCounts = await storage.getVoteCounts(sessionId);
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching votes:", error);
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  app.post("/api/votes", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = voteSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vote data" });
      }

      const { chartId, voteType } = parsed.data;
      
      const vote = await storage.createOrUpdateVote({
        chartId,
        voteType,
        sessionId,
      });

      res.json(vote);
    } catch (error) {
      console.error("Error casting vote:", error);
      res.status(500).json({ error: "Failed to cast vote" });
    }
  });

  return httpServer;
}

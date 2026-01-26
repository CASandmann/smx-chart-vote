import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const votes = pgTable("votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  chartId: integer("chart_id").notNull(),
  voteType: text("vote_type").notNull(),
  userId: text("user_id").notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  chartId: true,
  voteType: true,
  userId: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export interface Song {
  id: number;
  title: string;
  artist: string;
  bpm: string;
  genre: string;
  cover_thumb: string;
  cover: string;
  subtitle: string;
}

export interface Chart {
  id: number;
  song_id: number;
  difficulty: number;
  difficulty_display: string;
  difficulty_name: string;
  meter: number;
  steps_author: string;
  pass_count: number;
  play_count: number;
}

export interface ChartWithSong extends Chart {
  song: Song;
}

export interface VoteCount {
  chartId: number;
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
}

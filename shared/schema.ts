import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const votes = pgTable("votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  chartId: integer("chart_id").notNull(),
  voteType: text("vote_type").notNull(),
  sessionId: text("session_id").notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  chartId: true,
  voteType: true,
  sessionId: true,
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

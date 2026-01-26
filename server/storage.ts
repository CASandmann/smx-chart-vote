import { type Vote, type InsertVote, type VoteCount, votes } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getVote(chartId: number, userId: string): Promise<Vote | undefined>;
  createOrUpdateVote(vote: InsertVote): Promise<Vote>;
  deleteVote(chartId: number, userId: string): Promise<void>;
  getVoteCounts(userId: string): Promise<VoteCount[]>;
}

export class DatabaseStorage implements IStorage {
  async getVote(chartId: number, userId: string): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.chartId, chartId), eq(votes.userId, userId)));
    return vote;
  }

  async createOrUpdateVote(insertVote: InsertVote): Promise<Vote> {
    const existingVote = await this.getVote(insertVote.chartId, insertVote.userId);

    if (existingVote) {
      if (existingVote.voteType === insertVote.voteType) {
        await this.deleteVote(insertVote.chartId, insertVote.userId);
        return existingVote;
      }
      const [updated] = await db
        .update(votes)
        .set({ voteType: insertVote.voteType })
        .where(and(eq(votes.chartId, insertVote.chartId), eq(votes.userId, insertVote.userId)))
        .returning();
      return updated;
    }

    const id = randomUUID();
    const [vote] = await db
      .insert(votes)
      .values({ ...insertVote, id })
      .returning();
    return vote;
  }

  async deleteVote(chartId: number, userId: string): Promise<void> {
    await db
      .delete(votes)
      .where(and(eq(votes.chartId, chartId), eq(votes.userId, userId)));
  }

  async getVoteCounts(userId: string): Promise<VoteCount[]> {
    const allVotes = await db.select().from(votes);

    const counts = new Map<number, { upvotes: number; downvotes: number; userVote: "up" | "down" | null }>();

    for (const vote of allVotes) {
      const existing = counts.get(vote.chartId) ?? { upvotes: 0, downvotes: 0, userVote: null };

      if (vote.voteType === "up") {
        existing.upvotes++;
      } else {
        existing.downvotes++;
      }

      if (vote.userId === userId) {
        existing.userVote = vote.voteType as "up" | "down";
      }

      counts.set(vote.chartId, existing);
    }

    return Array.from(counts.entries()).map(([chartId, data]) => ({
      chartId,
      ...data,
    }));
  }
}

export const storage = new DatabaseStorage();

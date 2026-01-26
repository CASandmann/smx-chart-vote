import { type User, type InsertUser, type Vote, type InsertVote, type VoteCount } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getVote(chartId: number, sessionId: string): Promise<Vote | undefined>;
  createOrUpdateVote(vote: InsertVote): Promise<Vote>;
  getVoteCounts(sessionId: string): Promise<VoteCount[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private votes: Map<string, Vote>;

  constructor() {
    this.users = new Map();
    this.votes = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  private getVoteKey(chartId: number, sessionId: string): string {
    return `${chartId}:${sessionId}`;
  }

  async getVote(chartId: number, sessionId: string): Promise<Vote | undefined> {
    const key = this.getVoteKey(chartId, sessionId);
    return this.votes.get(key);
  }

  async createOrUpdateVote(insertVote: InsertVote): Promise<Vote> {
    const key = this.getVoteKey(insertVote.chartId, insertVote.sessionId);
    const existingVote = this.votes.get(key);
    
    if (existingVote) {
      if (existingVote.voteType === insertVote.voteType) {
        this.votes.delete(key);
        return existingVote;
      }
      const updatedVote: Vote = {
        ...existingVote,
        voteType: insertVote.voteType,
      };
      this.votes.set(key, updatedVote);
      return updatedVote;
    }
    
    const id = randomUUID();
    const vote: Vote = { ...insertVote, id };
    this.votes.set(key, vote);
    return vote;
  }

  async getVoteCounts(sessionId: string): Promise<VoteCount[]> {
    const counts = new Map<number, { upvotes: number; downvotes: number; userVote: "up" | "down" | null }>();
    
    for (const vote of this.votes.values()) {
      const existing = counts.get(vote.chartId) ?? { upvotes: 0, downvotes: 0, userVote: null };
      
      if (vote.voteType === "up") {
        existing.upvotes++;
      } else {
        existing.downvotes++;
      }
      
      if (vote.sessionId === sessionId) {
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

export const storage = new MemStorage();

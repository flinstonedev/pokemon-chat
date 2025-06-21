import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  // Chat threads for organizing conversations
  threads: defineTable({
    userId: v.string(), // Clerk user ID
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Chat messages within threads with tool support
  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
    content: v.optional(v.string()),
    toolCalls: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      arguments: v.string(), // JSON string
    }))),
    toolCallId: v.optional(v.string()),
    toolName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),

  // Keep the original numbers table for backward compatibility
  numbers: defineTable({
    value: v.number(),
  }),
});

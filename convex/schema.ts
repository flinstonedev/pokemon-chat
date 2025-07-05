import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  messages: defineTable({
    // The user's Clerk ID
    userId: v.string(),
    // The content of the user's message or the assistant's response
    content: v.string(),
    // The role of the entity sending the message
    role: v.union(v.literal("user"), v.literal("assistant")),
  }).index("by_userId", ["userId"]), // Index for efficient querying by user
});

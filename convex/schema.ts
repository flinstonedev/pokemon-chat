import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  messages: defineTable({
    // The content of the user's message or the assistant's response
    content: v.string(),
    // The role of the entity sending the message
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
    // The thread/conversation ID
    threadId: v.id("threads"),
    // When the message was created
    createdAt: v.number(),
    // The user's Clerk ID (optional for backwards compatibility)
    userId: v.optional(v.string()),
    // Tool-related fields (optional)
    toolCallId: v.optional(v.string()),
    toolCalls: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      arguments: v.string(),
    }))),
    toolName: v.optional(v.string()),
    contentSegments: v.optional(v.array(v.object({
      type: v.string(),
      content: v.optional(v.string()),
      toolCall: v.optional(v.object({
        id: v.string(),
        name: v.string(),
        arguments: v.string(),
      })),
      toolCallId: v.optional(v.string()),
    }))),
  }).index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // Add the threads table that's referenced by threadId
  threads: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    userId: v.string(),
  }).index("by_userId", ["userId"]),
});

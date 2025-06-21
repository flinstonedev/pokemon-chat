import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new chat thread
export const createThread = mutation({
    args: {
        userId: v.string(),
        title: v.string(),
    },
    returns: v.id("threads"),
    handler: async (ctx, { userId, title }) => {
        const now = Date.now();
        return await ctx.db.insert("threads", {
            userId,
            title,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Get user's chat threads
export const getUserThreads = query({
    args: {
        userId: v.string(),
    },
    returns: v.array(v.object({
        _id: v.id("threads"),
        _creationTime: v.number(),
        userId: v.string(),
        title: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    })),
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("threads")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

// Get messages in a thread
export const getThreadMessages = query({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.array(v.object({
        _id: v.id("messages"),
        _creationTime: v.number(),
        threadId: v.id("threads"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
        content: v.optional(v.string()),
        contentSegments: v.optional(v.array(v.union(
            v.object({
                type: v.literal("text"),
                content: v.string(),
            }),
            v.object({
                type: v.literal("tool_call"),
                toolCall: v.object({
                    id: v.string(),
                    name: v.string(),
                    arguments: v.string(),
                }),
            }),
            v.object({
                type: v.literal("tool_result"),
                toolCallId: v.string(),
                content: v.string(),
            })
        ))),
        toolCalls: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            arguments: v.string(),
        }))),
        toolCallId: v.optional(v.string()),
        toolName: v.optional(v.string()),
        createdAt: v.number(),
    })),
    handler: async (ctx, { threadId }) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_thread", (q) => q.eq("threadId", threadId))
            .order("asc")
            .collect();
    },
});

// Enhanced mutation to save a message with tool support
export const saveMessage = mutation({
    args: {
        threadId: v.id("threads"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
        content: v.optional(v.string()),
        toolCalls: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            arguments: v.string(),
        }))),
        toolCallId: v.optional(v.string()),
        toolName: v.optional(v.string()),
    },
    returns: v.id("messages"),
    handler: async (ctx, { threadId, role, content, toolCalls, toolCallId, toolName }) => {
        return await ctx.db.insert("messages", {
            threadId,
            role,
            content,
            toolCalls,
            toolCallId,
            toolName,
            createdAt: Date.now(),
        });
    },
});

// Update a message (for streaming)
export const updateMessage = mutation({
    args: {
        messageId: v.id("messages"),
        content: v.optional(v.string()),
        contentSegments: v.optional(v.array(v.union(
            v.object({
                type: v.literal("text"),
                content: v.string(),
            }),
            v.object({
                type: v.literal("tool_call"),
                toolCall: v.object({
                    id: v.string(),
                    name: v.string(),
                    arguments: v.string(),
                }),
            }),
            v.object({
                type: v.literal("tool_result"),
                toolCallId: v.string(),
                content: v.string(),
            })
        ))),
        toolCalls: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            arguments: v.string(),
        }))),
    },
    returns: v.null(),
    handler: async (ctx, { messageId, content, contentSegments, toolCalls }) => {
        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (contentSegments !== undefined) updateData.contentSegments = contentSegments;
        if (toolCalls !== undefined) updateData.toolCalls = toolCalls;

        await ctx.db.patch(messageId, updateData);
        return null;
    },
});

// Helper mutation to update thread timestamp
export const updateThreadTimestamp = mutation({
    args: {
        threadId: v.id("threads"),
    },
    returns: v.null(),
    handler: async (ctx, { threadId }) => {
        await ctx.db.patch(threadId, {
            updatedAt: Date.now(),
        });
        return null;
    },
}); 
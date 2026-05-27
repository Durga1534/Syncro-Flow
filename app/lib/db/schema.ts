import {pgEnum, pgTable as table} from "drizzle-orm/pg-core"
import * as t from "drizzle-orm/pg-core"

export const roles = pgEnum("roles", ["owner", "admin", "member"])
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done", "blocked"])
export const priority = pgEnum("priority", ["low", "medium", "high"])

export const users = table('users', {
    id: t.varchar("id").primaryKey(),
    email: t.varchar('email').notNull().unique(),
    name: t.varchar('name', {length: 256}),
    avatar: t.varchar('avatar'),
    createdAt:t.timestamp("created_at").defaultNow().notNull(),
})

export const workspaces = table("workspaces", {
    id: t.uuid("id").primaryKey().defaultRandom(),
    name: t.varchar("name").notNull(),
    ownerId: t.varchar('owner_id').notNull().references(() => users.id),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
})

export const members = table("workspace_members", {
    userId: t.varchar('user_id').notNull().references(() => users.id),
    workspaceId: t.uuid("workspace_id").notNull().references(() => workspaces.id),
    role: roles().default("member"),
    joinedAt: t.timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
    t.primaryKey({columns: [table.userId, table.workspaceId] })
])

export const tasks = table("tasks", {
    id:t.uuid("id").primaryKey().defaultRandom(),
    workspaceId: t.uuid("workspace_id").notNull().references(() => workspaces.id),
    title: t.varchar("title", {length: 256}).notNull(),
    description: t.text("description"),
    status: taskStatus().default("todo"),
    assigneeId: t.varchar('assignee_id').references(() => users.id),
    priority: priority().default("low"),
    createdBy: t.varchar('created_by').notNull().references(() => users.id),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
})

export const activities = table("activity_log", {
    id: t.uuid("id").primaryKey().defaultRandom(),
    workspaceId: t.uuid("workspace_id").notNull().references(() => workspaces.id),
    userId: t.varchar('user_id').notNull().references(() => users.id),
    action: t.varchar("action", {length: 100}).notNull(),
    entityType: t.varchar("entity_type", {length: 50}).notNull(),
    entityId: t.uuid("entity_id").notNull(),
    metadata: t.jsonb("metadata"),
    createdAt: t.timestamp('created_at').defaultNow().notNull(),
})




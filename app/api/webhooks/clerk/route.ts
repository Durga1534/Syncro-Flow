import {Webhook} from "svix"
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/app/lib/db";
import { users } from "@/app/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if(!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing svix headers", {status: 400})
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET)
    let event: WebhookEvent

    try {
        event = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature
        }) as WebhookEvent
    }catch(err) {
        return new Response("Invalid signature", {status: 400})
    }

    switch (event.type) {
        case "user.created":
            await db.insert(users).values({
                id: event.data.id,
                email:event.data.email_addresses[0]?.email_address ?? "",
                name: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`.trim(),
                avatar: event.data.image_url,
            })
            break

        case "user.updated":
            await db.update(users)
              .set({
                email: event.data.email_addresses[0]?.email_address ?? "",
                name: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`.trim(),
                avatar: event.data.image_url,
              })
              .where(eq(users.id, event.data.id))
              break

        case "user.deleted":
            if (event.data.id) {
                await db.delete(users)
                   .where(eq(users.id, event.data.id))
            }
            break     
    }
    return new Response("OK", {status: 200})
}
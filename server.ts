import { createServer } from "http"
import { parse } from "url"
import next from "next"
import {WebSocketServer, WebSocket} from "ws"
import { subscriber, publisher } from "@/app/lib/redis/client"

const dev = process.env.NODE_ENV !== "production"
const app = next({dev})
const handle = app.getRequestHandler()

const workspaceClients = new Map<string, Set<WebSocket>>()

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true)
        handle(req, res, parsedUrl)
    })

    const wss = new WebSocketServer({ server })

    wss.on("connection", (ws, req) => {
        //Step 1 - get workspaceID from query params
        const url = new URL(req.url!, `https:/localhost:3000`)

    })
})
import Redis from "ioredis";
import {Redis as UpstashRedis} from "@upstash/redis"

if(!process.env.UPSTASH_REDIS_URL) {
    throw new Error("UPSTASH_REDIS_URL is not set")
}

if(!process.env.UPSTASH_REDIS_REST_URL) {
    throw new Error("UPSTASH_REDIS_REST_URL is not set")
}

if(!process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("UPSTASH_REDIS_REST_TOKEN is not set")
}

export const redis = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

declare global {
    var redisPublisher: Redis | undefined
    var redisSubscriber: Redis | undefined
}

if(!global.redisPublisher) {
    global.redisPublisher = new Redis(process.env.UPSTASH_REDIS_URL)
}

if(!global.redisSubscriber) {
    global.redisSubscriber = new Redis(process.env.UPSTASH_REDIS_URL)
}

export const publisher = global.redisPublisher
export const subscriber = global.redisSubscriber
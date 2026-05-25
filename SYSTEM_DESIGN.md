# Core Questions before building this paltform

#Architecture
Browser (User A) ->
-> Sever Action(task update)
-> PostgreSQL write
-> Redis PUBLISH to channel "workspace:{id}"
-> All subscribers receive update
-> Browser (User B) updates instantly

1) How does task update from User A reach UserB in under 100ms?
1.The persistent connection (WebSockets)
Instead of opening and closing a new connection for every request, User A and User B maintain an open WebSocket connection
to the server. This eliminates the Handshake overhead (SYN -> SYN -> ACK -> ACK) that usually adds 20-50ms to every HTTP request

2.The in-memory Pub/Sub(Redis)
When User A sends a task update, the server doesn't write to slow disk based database (like PostgreSQL) and wait. Instead:
1. The server receives the update
2. It publishes the update to Redis Pub/Sub channel (eg: channel:workspace_123)
3. Because Redis stores data entirely in RAM, this operation typically takes <1ms.

The Latency Breakdown (Estimated)
Step                   Action                                   Latency
Network Trip 1         User A -> Server (WebSocket)             ~30 - 40ms
Server Logic           Validation& Auth                         ~5ms
Pub/Sub                Server->Redis->Sever                     ~2ms
Network Trip 2         Server-User B(WebSocket)                 ~20-40ms
Client Render          User B UI Update                         ~10ms
Total                                                           ~77-79ms

2) What happens if Redis goes down mid-session?
If redis goes down mid-session, the real time "push" mechanisam breaks, but a well-designed system shouldn't crash. Here is how
you handle it to maintain "High Availability" and keep the users from noticing a total failure

1.The Fallback: HTTP Load Polling
The application should detect the websocket/redis failure and automatically switch User B to HTTP Long Polling
-> Instead of a push, User B's client starts asking the server every few seconds, "Is there anything new"
-> The server then queries the primary database(PostgreSQL/MongoDB) directly.
-> Result: The "Under 100ms" magic is gone it might jump to 1-2 seconds. but the app stays functional.

2.High Availability (Redis Sentine/Cluster)
In a production environment, you don't use a single Redis instance.You use Redis Sentinel or Redis Cluster:
-> Master-Slave setup: if the "Master" Redis node fails, one of the slave nodes is automatically promoted to Master
-> Failover Time: This switch usually takes under 1 second, meaning users might only experience a flicker in their connection.

3. Data Persistance (AOF and RDB)
if Redis crashes and restarts, it needs to recover the data it had in RAM
-> AOF (Append only file): Logs every write operation as it happens.
-> RDB (Redis Database Backup): Takes snapshots of your data at specifc intervals

4. Client-Side Reconnection Logic
User B's browser shouldn't just give up. The frontend code should implement. Exponential Backoff:
1. Websocket disconnects
2. App tries to reconnect in 1s.
3. Fails? Tries again in 2s, then 4s, 8s, etc.
4. Once Redis/Sever is back up, the connection resumes

3) Why PostgreSQL over MongoDB for this data?
In a real-time system like a task manager or a SaaS platform, the choice between PostgreSQL and MongoDB often comes down to how you
handle relationships and data integrity.
Here is why PostgreSQL is typically the superior choice for this specific use case:

1.Relational Integrity (strict schemas)
A task update doesn't exist in a vacuum. It belongs to a User, which belongs to a Workspace, which might have Permissions.
-> PostgreSQL: Uses Foreign keys to ensure that you can't have a task belonging to a user who doesn't exist. This prevents orphaned data.
-> MongoDB: Is "Schemaless" While flexible, it's easy to accidentally save a task with a missing user_id or a malformed workspace_id, leading to bugs
that are hard to track down in production

2.ACID Compliance
When user A updates a task, you might need to update several things at once: the task status, the workspace activity log, and the user's notification count.
PostgreSQL: Provides robust ACID guarantees. If the power goes out the server crashes mid-update, the transaction either fully completes or fully rolls back. No partial,corrupted data 
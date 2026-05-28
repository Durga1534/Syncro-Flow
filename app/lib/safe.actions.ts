import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

type ActionResult<T> = 
    | {success: true; data: T} 
    | {success: false; error: string}

export function createAction<TInput, TOutput>(
    schema: z.ZodType<TInput>,
    action: (data: TInput, userId: string) => Promise<TOutput>
) {
    return async(input: unknown): Promise<ActionResult<TOutput>> => {
        // step 1 - check auth
        const { userId } = await auth();

        if(!userId) {
            return {
                success: false,
                error: "Unauthorized",
            }
        }

        // step 2 - validate input with zod
        const parsed = schema.safeParse(input);

        if(!parsed.success) {
            return {
                success: false,
                error: parsed.error.message ?? "Invalid input",
            }
        }

        //step 3 - run the function
        try {
            const data = await action(parsed.data, userId)
            return {
                success: true,
                data,
            }
        }catch(err) {
            return {
                success: false,
                error:err instanceof Error ? err.message :  "Something went wrong",
            }
        }
    }
}
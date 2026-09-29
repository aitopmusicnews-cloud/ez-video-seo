import { z } from 'zod';
export const resultSchema=z.object({summary:z.string(),genre:z.string(),mood:z.string(),visuals:z.string(),caveats:z.array(z.string()),titles:z.array(z.object({text:z.string().max(100),reason:z.string()})).min(3).max(5),description:z.string().max(5000),keywords:z.array(z.string()).max(25),hashtags:z.array(z.string()).max(3)});
export type Result=z.infer<typeof resultSchema>;

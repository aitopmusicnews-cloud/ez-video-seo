import { authenticated } from '@/lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){const unlocked=authenticated(request);return Response.json({ready:unlocked&&!!process.env.OPENAI_API_KEY,locked:!unlocked},{headers:{'Cache-Control':'no-store'}});}

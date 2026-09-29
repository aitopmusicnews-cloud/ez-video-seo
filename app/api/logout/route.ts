import { sameOrigin,sessionCookie } from '@/lib/auth';
export async function POST(request:Request){if(!sameOrigin(request))return new Response(null,{status:403});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie('',0)}});}

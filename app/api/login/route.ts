import { createSession,passwordMatches,sameOrigin,sessionCookie } from '@/lib/auth';
export const runtime='nodejs';
const attempts=new Map<string,{count:number;reset:number}>();
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Request not allowed.'},{status:403});
 if((process.env.APP_PASSWORD||'').length<16)return Response.json({error:'Set APP_PASSWORD on Render to a password of at least 16 characters.'},{status:503});
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const now=Date.now();for(const [k,v]of attempts)if(v.reset<now)attempts.delete(k);const rate=attempts.get(ip)||{count:0,reset:now+900000};if(rate.count>=10)return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
 rate.count++;attempts.set(ip,rate);
 try{const raw=await request.text();if(raw.length>2048)throw new Error();const {password}=JSON.parse(raw);if(typeof password!=='string'||!passwordMatches(password))return Response.json({error:'Incorrect password.'},{status:401});attempts.delete(ip);return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(createSession()),'Cache-Control':'no-store'}});}catch{return Response.json({error:'Enter your app password.'},{status:400});}
}

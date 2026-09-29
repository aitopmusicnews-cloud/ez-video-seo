import { z } from 'zod';
export const resultSchema=z.object({summary:z.string(),genre:z.string(),mood:z.string(),visuals:z.string(),caveats:z.array(z.string()),titles:z.array(z.object({text:z.string().max(100),reason:z.string()})).min(3).max(5),description:z.string().max(5000),keywords:z.array(z.string()).max(25),hashtags:z.array(z.string()).max(3),searchSignals:z.array(z.string()).max(20).default([]),searchSignalsLive:z.boolean().default(false)});
export type Result=z.infer<typeof resultSchema>;

// Constrain the shape at generation time; enforce presentation limits locally.
const textField={type:'string'};
const textList={type:'array',items:textField};
export const resultJsonSchema={type:'object',additionalProperties:false,properties:{summary:textField,genre:textField,mood:textField,visuals:textField,caveats:textList,titles:{type:'array',items:{type:'object',additionalProperties:false,properties:{text:textField,reason:textField},required:['text','reason']}},description:textField,keywords:textList,hashtags:textList},required:['summary','genre','mood','visuals','caveats','titles','description','keywords','hashtags']};
const generatedSchema=z.object({summary:z.string(),genre:z.string(),mood:z.string(),visuals:z.string(),caveats:z.array(z.string()),titles:z.array(z.object({text:z.string().min(1),reason:z.string()})).min(3),description:z.string(),keywords:z.array(z.string()),hashtags:z.array(z.string())});
export function normalizeResult(value:unknown):Result {
 const v=generatedSchema.parse(value);
 const shorten=(s:string,max:number)=>{s=s.trim();if(s.length<=max)return s;const cut=s.slice(0,max-1);const space=cut.lastIndexOf(' ');return (space>max*.65?cut.slice(0,space):cut).trimEnd()+'…';};
 const titles=v.titles.slice(0,3).map(t=>({...t,text:shorten(t.text,100)}));
 let size=0;const keywords=[...new Set(v.keywords.map(k=>k.trim()).filter(Boolean))].filter(k=>{const n=k.length+(size?2:0);if(size+n>450)return false;size+=n;return true;}).slice(0,25);
 const hashtags=[...new Set(v.hashtags.map(h=>'#'+h.replace(/^#+/,'').replace(/\s+/g,'')).filter(h=>h.length>1))].slice(0,3);
 return resultSchema.parse({...v,titles,description:shorten(v.description,5000),keywords,hashtags});
}

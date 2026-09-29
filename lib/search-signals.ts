export type FetchLike=(input:string|URL,init?:RequestInit)=>Promise<Response>;

const clean=(value:string)=>value.trim().replace(/\s+/g,' ');

export function buildYouTubeSearchSeeds(artist:string,song:string){
  const a=clean(artist),s=clean(song);
  const seeds=[
    a&&s?`${a} ${s}`:'',
    a&&s?`${a} ${s} lyrics`:'',
    s?`${s} lyric video`:'',
    a?`${a} music`:'',
  ].filter(Boolean);
  const seen=new Set<string>();
  return seeds.filter(seed=>{const key=seed.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
}

function parseSuggestions(value:unknown){
  if(!Array.isArray(value)||!Array.isArray(value[1]))return [] as string[];
  return value[1].filter((item):item is string=>typeof item==='string').map(clean).filter(Boolean);
}

export async function fetchYouTubeSearchSignals(artist:string,song:string,fetcher:FetchLike=fetch){
  const seeds=buildYouTubeSearchSeeds(artist,song);
  if(!seeds.length)return [];
  const settled=await Promise.allSettled(seeds.map(async seed=>{
    const url=new URL('https://suggestqueries.google.com/complete/search');
    url.searchParams.set('client','firefox');
    url.searchParams.set('ds','yt');
    url.searchParams.set('hl','en');
    url.searchParams.set('gl','US');
    url.searchParams.set('q',seed);
    const response=await fetcher(url,{headers:{'Accept':'application/json','Accept-Language':'en-US,en;q=0.9'},signal:AbortSignal.timeout(6500)});
    if(!response.ok)return [];
    return parseSuggestions(await response.json());
  }));
  const seen=new Set<string>(),signals:string[]=[];
  for(const item of settled){
    if(item.status!=='fulfilled')continue;
    for(const suggestion of item.value){
      const value=clean(suggestion);
      const key=value.toLowerCase();
      if(!value||value.length>120||seen.has(key))continue;
      seen.add(key);signals.push(value);
      if(signals.length>=20)return signals;
    }
  }
  return signals;
}

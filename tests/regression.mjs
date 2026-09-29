import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};cache.set(file,m.exports);vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(id=>id.startsWith('@/')?load(id.slice(2)+'.ts'):require(id),m,m.exports);return m.exports;}
process.env.APP_PASSWORD='regression-password-not-a-real-secret';process.env.OPENAI_API_KEY='mock-only';
const {createSession}=load('lib/auth.ts');const {POST}=load('app/api/analyze/route.ts');
const valid={summary:'Test song',genre:'Hip hop',mood:'Upbeat',visuals:'Audio-only upload; no video scenes analyzed.',caveats:['Samples only'],titles:Array.from({length:6},()=>({text:'A long title '.repeat(20),reason:'Relevant'})),description:'d'.repeat(5100),keywords:Array.from({length:30},(_,i)=>'keyword '+i),hashtags:['#music','#lyrics','#hiphop','#extra']};
const input={artist:'Test Artist',song:'Test Song',notes:'',duration:60,audio:'A'.repeat(100),audioSeconds:45,frames:[]};let openAiCalls=0,suggestCalls=0,lastSeoBody=null;
globalThis.fetch=async(url,options)=>{
  if(String(url).includes('suggestqueries.google.com')){suggestCalls++;const q=new URL(String(url)).searchParams.get('q');return Response.json([q,[`${q} lyric video`,`${q} lyrics`,`hip hop lyric video`]]);}
  openAiCalls++;const body=JSON.parse(options.body);if(body.model==='gpt-4.1-mini'){assert.equal(body.response_format.json_schema.strict,true);lastSeoBody=body;}return Response.json({choices:[{finish_reason:'stop',message:{content:body.model==='gpt-audio'?'Test audio analysis':JSON.stringify(valid)}}]});
};
const request=(body)=>new Request('https://example.com/api/analyze',{method:'POST',headers:{origin:'https://example.com',host:'example.com',cookie:'ezvideo_session='+createSession()},body:JSON.stringify(body)});
const r=await POST(request(input));assert.equal(r.status,200);const data=await r.json();assert.equal(data.titles.length,3);assert(data.titles.every(t=>t.text.length<=100));assert.equal(data.hashtags.length,3);assert(data.description.length<=5000);assert.equal(openAiCalls,2);assert(suggestCalls>0);assert.equal(data.searchSignalsLive,true);assert(data.searchSignals.length>0);assert(lastSeoBody.messages[1].content[0].text.includes('youtubeAutocompleteSignals'));
const bad=await POST(request({...input,frames:[{time:0,image:'invalid'}]}));assert.equal(bad.status,422);assert.equal((await bad.json()).code,'INVALID_VIDEO_SAMPLES');assert.equal(openAiCalls,2);
const {sampleVideo}=load('lib/media.ts');let decodeCalls=0;
globalThis.document={createElement:tag=>{assert.equal(tag,'video');return {removeAttribute(){},load(){}};}};
globalThis.AudioContext=class{async decodeAudioData(){decodeCalls++;return {duration:60,length:960000,sampleRate:16000,numberOfChannels:1,getChannelData:()=>new Float32Array(960000)};}async close(){}};
// Reuse one channel buffer, as browser AudioBuffer does.
const channel=new Float32Array(960000);globalThis.AudioContext.prototype.decodeAudioData=async()=>{decodeCalls++;return {duration:60,length:channel.length,sampleRate:16000,numberOfChannels:1,getChannelData:()=>channel};};
const samples=await sampleVideo(new File(['test'],'song.mp3',{type:'audio/mpeg'}),()=>{});assert.equal(samples.frames.length,0);assert.equal(samples.duration,60);assert.equal(samples.audioSeconds,45);assert.equal(decodeCalls,1);assert.equal(Buffer.from(samples.audio,'base64').subarray(0,4).toString(),'RIFF');
console.log('PASS: audio-only extraction, live YouTube search signals, strict response format, output normalization, invalid input rejected before API calls.');

export async function sampleVideo(file: File, report: (text:string, progress:number)=>void) {
  if (file.size > 150 * 1024 * 1024) throw new Error('Choose a video smaller than 150 MB.');
  const url=URL.createObjectURL(file); const video=document.createElement('video');
  video.muted=true; video.preload='auto'; video.playsInline=true;
  const wait=(event:string)=>new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{clean();reject(new Error('This video could not be read. Try an MP4 with H.264 video and AAC audio.'));},15000);const ok=()=>{clean();resolve();};const fail=()=>{clean();reject(new Error('Unsupported video. Try an MP4 with H.264 video and AAC audio.'));};const clean=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',fail);};video.addEventListener(event,ok,{once:true});video.addEventListener('error',fail,{once:true});});
  try {
    const ready=wait('loadeddata');video.src=url;await ready;
    const duration=video.duration;
    if(!Number.isFinite(duration)||duration<1||duration>480)throw new Error('Choose a music video between 1 second and 8 minutes long.');
    const canvas=document.createElement('canvas'); canvas.width=640;canvas.height=Math.round(640*video.videoHeight/video.videoWidth);
    const context=canvas.getContext('2d');if(!context)throw new Error('Your browser cannot read video frames.');
    const frames:{time:number;image:string}[]=[];
    for(let i=0;i<10;i++){report('Reading video scenes…',10+i*3);const time=duration*(i+.5)/10;const seek=wait('seeked');video.currentTime=time;await seek;context.drawImage(video,0,0,canvas.width,canvas.height);frames.push({time:Math.round(time),image:canvas.toDataURL('image/jpeg',.65)});}
    report('Preparing audio samples…',42);
    const audioContext=new AudioContext(); let audio:AudioBuffer;
    try {audio=await audioContext.decodeAudioData(await file.arrayBuffer());}catch{throw new Error('The audio track could not be read. Export as MP4 with AAC audio, then try again.');}finally{await audioContext.close();}
    const rate=16000, segment=Math.min(15,audio.duration/3), count=Math.floor(segment*rate),samples=new Float32Array(count*3);
    const starts=[0,Math.max(0,(audio.duration-segment)/2),Math.max(0,audio.duration-segment)];
    for(let s=0;s<3;s++)for(let i=0;i<count;i++){let value=0;const index=Math.min(audio.length-1,Math.floor((starts[s]+i/rate)*audio.sampleRate));for(let c=0;c<audio.numberOfChannels;c++)value+=audio.getChannelData(c)[index]/audio.numberOfChannels;samples[s*count+i]=value;}
    const buffer=new ArrayBuffer(44+samples.length*2), view=new DataView(buffer);
    const str=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
    str(0,'RIFF');view.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);
    for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,x<0?x*32768:x*32767,true);}
    const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return {duration,frames,audio:btoa(binary),audioSeconds:segment*3};
  } finally {video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
}

// Original, bounded instrumental sketches. No network, recording or autoplay.
export function songWav(song) {
  if(!song || !Number.isFinite(song.bpm) || song.bpm<60 || song.bpm>180 || !Array.isArray(song.notes) || !song.notes.length || song.notes.length>64 || song.notes.some(n=>!n||!Number.isInteger(n.midi)||n.midi<48||n.midi>84||!Number.isFinite(n.beats)||n.beats<.25||n.beats>2)) throw Error('SONG_INVALID');
  const rate=22050;
  const seconds=song.notes.reduce((sum,n)=>sum+n.beats*60/song.bpm,0);
  if(seconds>40) throw Error('SONG_INVALID');
  const samples=Math.ceil((seconds+.2)*rate);
  const buffer=new ArrayBuffer(44+samples*2),view=new DataView(buffer);
  const ascii=(offset,s)=>{for(let i=0;i<s.length;i++)view.setUint8(offset+i,s.charCodeAt(i));};
  ascii(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);ascii(8,'WAVE');ascii(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
  ascii(36,'data');view.setUint32(40,samples*2,true);
  let cursor=0;
  for(const note of song.notes) {
    const duration=note.beats*60/song.bpm;
    const start=Math.round(cursor*rate),end=Math.round((cursor+duration)*rate);
    const hz=440*2**((note.midi-69)/12);
    for(let i=start;i<end;i++) {
      const t=(i-start)/rate;
      const envelope=Math.min(1,t/.015)*Math.max(0,1-t/(duration*.92))**2;
      const tone=(Math.sin(2*Math.PI*hz*t)+.22*Math.sin(4*Math.PI*hz*t))*.28*envelope;
      view.setInt16(44+i*2,Math.round(tone*32767),true);
    }
    cursor+=duration;
  }
  return buffer;
}

// Public editorial placement only; not provider metadata, source audio, or musical ancestry.
export const catalog = {
  schema:'static-field/week-catalog/v0',
  album:'a week together',
  albumUrl:'https://suno.com/album/7c2ca64a-32ed-4477-a7cb-e00d1a14c9bf',
  source:{repository:'the-static-collective/webZ',path:'week/index.html',gitBlobSha1:'bc8450793454d2db3988b38029b24243d6fe97f9'},
  letters:[
    {number:1,date:'Mon · October 12',title:'Begin again.',question:'What deserves another beginning?',tracks:[['70b1d32e-21b6-4340-990d-1a4ef67cfc42','Rosemary Bloom'],['66ce822e-be59-4511-887b-61feda608300','Where the Porch Boards Bend']]},
    {number:2,date:'Tue · October 13',title:'Warmth & motion.',question:'What makes the hard things softer?',tracks:[['d4a7e58e-5930-4cbb-825f-9c6c8ed6da27','Comfy Sweater (Psychedelic Country Daydream)'],['2ec9a56b-6916-4af7-a4dd-5031e42f0bea','Neon Fiddle Bounce Drop']]},
    {number:3,date:'Wed · October 14',title:'Good ground.',question:'What are you planting this week?',tracks:[['2ba6fe93-9d4e-4098-acc5-7e53f9d4918b','Neon Aria: Lo-Fi Soul Overture'],['02af5b55-74b7-455e-9b9f-f7a840ccac3e','Good Ground']]},
    {number:4,date:'Thu · October 15',title:'Make room.',question:'Who could use one more chair?',tracks:[['f180e7d1-8b2a-4f89-93f8-3c26544d4701','Standing on the Hill (Psychedelic Phonk Pop Mix)'],['d6dfeebd-65e7-4c0e-ba84-c092f671e495','Room at the Table']]},
    {number:5,date:'Fri · October 16',title:'Faith & release.',question:'What can you set down today?',tracks:[['a3cac8da-9c29-43d2-bf21-ba00a2b379bc','Godfather Got My Back'],['c3a86308-bc04-4abc-911e-f55b03c4d5b2','Meet Me in the Valley (Loaf-i Mix)']]},
    {number:6,date:'Sat · October 17',title:'Through the night.',question:'Who would you like beside you at morning?',tracks:[['5c5409ab-97c9-4035-bea0-d29e256e03fd','Let It Find Us'],['5195c966-d1da-4e87-a9d4-b48faacf0047','Midnight Phonk Blues']]},
    {number:7,date:'Sun · October 18',title:'Come home.',question:'What have you brought home?',tracks:[['27efd551-733b-4192-be02-a90e3f574f53','There by Two'],['c737f489-2912-408e-a444-bb35cdf893cd','Blue Rosemary']]}
  ]
};
export const allTracks=catalog.letters.flatMap(letter=>letter.tracks.map(([id,title])=>({id,title,letter})));
export const trackById=id=>allTracks.find(track=>track.id===id)??null;

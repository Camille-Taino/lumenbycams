/* =====================================================================
   Lumen · data.js
   Content the app shows: scripture (KJV, public domain), guide notes,
   stickers, stamps, prompts and the demo content a fresh install starts
   with. Edit freely: app.js reads these as global constants.
   ===================================================================== */

/** Date helper: "YYYY-MM-DD" for a date in the device's own time zone. */
function localDateKey(d){ const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; }
function daysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return localDateKey(d); }

/* ---------- scripture (KJV, public domain) ---------- */
const V = {
  IS40:{ref:'Isaiah 40:31',t:'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',tags:'wait waiting patience tired weary strength hope job news'},
  IS40b:{ref:'Isaiah 40:29',t:'He giveth power to the faint; and to them that have no might he increaseth strength.',tags:'tired weary weak exhausted strength'},
  PHP6:{ref:'Philippians 4:6',t:'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',tags:'anxious anxiety worry worried stress work nervous'},
  PHP7:{ref:'Philippians 4:7',t:'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',tags:'peace anxious worry mind calm'},
  PE57:{ref:'1 Peter 5:7',t:'Casting all your care upon him; for he careth for you.',tags:'anxious worry care burden stress'},
  MT634:{ref:'Matthew 6:34',t:'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',tags:'worry tomorrow future anxious work'},
  PS55:{ref:'Psalm 55:22',t:'Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.',tags:'burden heavy stress work anxious'},
  MT1128:{ref:'Matthew 11:28',t:'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',tags:'tired rest weary heavy work burnout'},
  JN1427:{ref:'John 14:27',t:'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',tags:'peace afraid fear troubled anxious'},
  JN316:{ref:'John 3:16',t:'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',tags:'love salvation believe god loved'},
  PS4610:{ref:'Psalm 46:10',t:'Be still, and know that I am God.',tags:'still peace rest quiet calm'},
  PS231:{ref:'Psalm 23:1',t:'The LORD is my shepherd; I shall not want.',tags:'provision shepherd trust need'},
  PS234:{ref:'Psalm 23:4',t:'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',tags:'fear afraid grief comfort dark valley'},
  PS3418:{ref:'Psalm 34:18',t:'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',tags:'grief grieving sad broken heartbroken loss'},
  MT54:{ref:'Matthew 5:4',t:'Blessed are they that mourn: for they shall be comforted.',tags:'grief grieving mourn loss sad'},
  LAM22:{ref:'Lamentations 3:22–23',t:'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',tags:'morning hope new mercy faithful hopeful'},
  LAM25:{ref:'Lamentations 3:25–26',t:'The LORD is good unto them that wait for him, to the soul that seeketh him. It is good that a man should both hope and quietly wait for the salvation of the LORD.',tags:'wait waiting patience hope'},
  RO1212:{ref:'Romans 12:12',t:'Rejoicing in hope; patient in tribulation; continuing instant in prayer;',tags:'patience hope prayer trouble'},
  PS37:{ref:'Psalm 37:7',t:'Rest in the LORD, and wait patiently for him: fret not thyself because of him who prospereth in his way.',tags:'rest wait patience fret comparison'},
  GAL5:{ref:'Galatians 5:22',t:'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',tags:'fruit patience love joy peace'},
  PS48:{ref:'Psalm 4:8',t:'I will both lay me down in peace, and sleep: for thou, LORD, only makest me to dwell in safety.',tags:'sleep night insomnia rest peace safe'},
  JOS19:{ref:'Joshua 1:9',t:'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',tags:'courage afraid fear new brave'},
  TH518:{ref:'1 Thessalonians 5:18',t:'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',tags:'grateful gratitude thanks thankful'},
  PS11824:{ref:'Psalm 118:24',t:'This is the day which the LORD hath made; we will rejoice and be glad in it.',tags:'joy grateful glad today happy'},
  PR35:{ref:'Proverbs 3:5–6',t:'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',tags:'decision choice trust direction confused wisdom'},
  PS119:{ref:'Psalm 119:105',t:'Thy word is a lamp unto my feet, and a light unto my path.',tags:'word light lamp direction guidance'}
};
const PHIL4 = [
  [4,'Rejoice in the Lord alway: and again I say, Rejoice.'],
  [5,'Let your moderation be known unto all men. The Lord is at hand.'],
  [6,V.PHP6.t],[7,V.PHP7.t],
  [8,'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.'],
  [9,'Those things, which ye have both learned, and received, and heard, and seen in me, do: and the God of peace shall be with you.']
];
const FEEL = {
  Anxious:{v:'PE57',why:'“Casting” is the word used for throwing a cloak onto a donkey’s back. Peter invites you to hand the whole weight over, not carry half of it.',q:'What is one worry you can name and hand over right now?'},
  Tired:{v:'MT1128',why:'Jesus spoke this to ordinary working people carrying heavy religious and daily loads. The offer is rest, not a longer to-do list.',q:'Where could you stop striving for ten minutes today?'},
  Waiting:{v:'LAM25',why:'Written in the rubble of a fallen city, this is one of Scripture’s most hopeful lines. Quiet waiting is trust in the One who is good.',q:'What would “quietly wait” look like in your next hour?'},
  Grateful:{v:'PS11824',why:'A song the pilgrims sang on the way up to Jerusalem. Gratitude here is a choice made about today, before you know how it ends.',q:'Name three small gifts from the last 24 hours.'},
  Grieving:{v:'PS3418',why:'“Nigh” means close enough to touch. The Psalm doesn’t rush you out of sorrow; it promises company in it.',q:'What would you like to tell God about your loss, without tidying it up?'},
  Afraid:{v:'JOS19',why:'Spoken to Joshua as he stepped into Moses’ role. Courage here rests on presence: “the LORD thy God is with thee.”',q:'What next step would you take if you knew God was beside you?'}
};


/* ---------- journal decorations & prompts ---------- */
const STICKERS = {
  sprout:'<svg viewBox="0 0 24 24" fill="none" stroke="#5F7257" stroke-width="1.5" stroke-linecap="round"><path d="M12 20v-8M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2.5-5 6-5 0 3-2.5 5-6 5z"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="#A97C2F" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="#F1E2BF"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="#F1DCD6" stroke="#A35F59" stroke-width="1.5"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="#F1E2BF" stroke="#A97C2F" stroke-width="1.3" stroke-linejoin="round"><path d="M12 3l2.4 5.6 6 .6-4.6 4 1.4 5.9L12 16l-5.2 3.1 1.4-5.9-4.6-4 6-.6z"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="#F3DDB4" stroke="#A97C2F" stroke-width="1.3"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  dove:'<svg viewBox="0 0 24 24" fill="#FBF6EC" stroke="#1F2A44" stroke-width="1.3" stroke-linejoin="round"><path d="M3 14c3-1 5-3 6-6 2 2 4 2 6 1-1 3 0 5 2 6-3 1-6 1-9 0-2 1-4 0-5-1z"/></svg>',
  flower:'<svg viewBox="0 0 110 180" fill="none"><path d="M55 175C52 130 58 90 54 40" stroke="#5F7257" stroke-width="2.5"/><path d="M54 120c-14-6-24-18-26-32 14 3 23 14 26 32zM56 95c12-8 22-10 32-8-6 11-18 14-32 8z" fill="#7E8F74"/><g fill="#C98F8A" opacity=".92"><ellipse cx="54" cy="24" rx="9" ry="15"/><ellipse cx="38" cy="36" rx="9" ry="15" transform="rotate(-60 38 36)"/><ellipse cx="70" cy="36" rx="9" ry="15" transform="rotate(60 70 36)"/><ellipse cx="44" cy="54" rx="9" ry="14" transform="rotate(-130 44 54)"/><ellipse cx="64" cy="54" rx="9" ry="14" transform="rotate(130 64 54)"/></g><circle cx="54" cy="42" r="7" fill="#E7B25C"/></svg>',
  lavender:'<svg viewBox="0 0 60 180" fill="none"><path d="M30 178C28 120 32 70 30 20" stroke="#5F7257" stroke-width="2.2"/><g fill="#9C8BB8">'+Array.from({length:9},(_,i)=>`<ellipse cx="${i%2?36:24}" cy="${22+i*9}" rx="6" ry="4.5"/>`).join('')+'</g></svg>',
  fern:'<svg viewBox="0 0 80 180" fill="none" stroke="#5F7257" stroke-width="2" stroke-linecap="round"><path d="M40 178C38 120 42 60 40 8"/>'+Array.from({length:10},(_,i)=>`<path d="M40 ${30+i*14}c-${14-i}-2-${22-i}-8-${26-i}-14M40 ${34+i*14}c${14-i}-2 ${22-i}-8 ${26-i}-14"/>`).join('')+'</svg>'
};
const WASHI = {
  rose:'background-color:rgba(201,143,138,.62);background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)',
  sage:'background-color:rgba(126,143,116,.55);background-image:radial-gradient(rgba(255,255,255,.55) 2px,transparent 2.5px);background-size:10px 10px',
  gold:'background-color:rgba(231,178,92,.5)',
  navy:'background-color:rgba(31,42,68,.5);background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.25) 0 3px,transparent 3px 14px)'
};
const STAMPS = ['BE STILL<br>&amp; WAIT','PRAYER<br>ANSWERED','GRACE<br>UPON GRACE','THANK<br>YOU'];
const PROMPTS = ['What is God saying to me?','What will I carry into today?','Where have I been impatient this week?','Who could I be patient with today?','What am I grateful for right now?','What do I need to let go of?','Where did I notice God this week?'];

/* ---------- demo content ----------
   Used the first time the app opens, and when you tap "Reset demo" in More.
   Entries marked example:true show an "example page" label. */
function makeDemoState(){
  return {
  name:'Hannah', big:false,
  entries:{
    [daysAgo(1)]:{example:true, verse:'GAL5', o:'Fruit grows slowly — like the tomatoes on the balcony.', a:'Learning to sit still for ten minutes before work.', p:'Lord, grow patience in me the way You grow fruit: quietly.', free:'', decos:[], paper:'lined', soap:true},
    [daysAgo(3)]:{example:true, verse:'PS37', o:'Rest first, then wait. The order matters.', a:'', p:'Thank You for Lola’s clear scan.', free:'', decos:[], paper:'lined', soap:true}
  },
  prayers:[
    {id:1,title:'Lola’s recovery after surgery',note:'Strength for her and patience for Mum.',tag:'Family',since:'14 Sep',answered:null,count:12},
    {id:2,title:'Peace while I wait on the job news',note:'',tag:'Work',since:'1 Oct',answered:null,count:6},
    {id:3,title:'Wisdom for Mika’s school choice',note:'',tag:'Friends',since:'22 Aug',answered:null,count:9},
    {id:4,title:'A church small group',note:'',tag:'Me',since:'Jul',answered:{date:'19 Sep',how:'Found the Thursday group. Felt at home from week one.'}},
    {id:5,title:'Reconciled with Ate Joy',note:'',tag:'Family',since:'Aug',answered:{date:'2 Sep',how:'Coffee, a long talk, hugs. Grace upon grace.'}}
  ],
  gratitude:{}
  };
}

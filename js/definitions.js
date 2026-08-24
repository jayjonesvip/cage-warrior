'use strict';

const planDefs = [
  {id:'striker',icon:'🥊',name:'STRIKER',text:'Keep the fight standing with fast combinations, kicks, and knockout power.'},
  {id:'grappler',icon:'🔒',name:'GRAPPLER',text:'Take the fight down, control position, and hunt the submission.'}
];

const fighterAvatars = [
  {id:'fighter-01',asset:'assets/avatars/fighter-avatar-01.png',stats:{power:8,speed:6,chin:2,cardio:4}},
  {id:'fighter-02',asset:'assets/avatars/fighter-avatar-02.png',stats:{power:7,speed:6,chin:3,cardio:4}},
  {id:'fighter-03',asset:'assets/avatars/fighter-avatar-03.png',stats:{power:8,speed:4,chin:4,cardio:4}},
  {id:'fighter-04',asset:'assets/avatars/fighter-avatar-04.png',stats:{power:7,speed:5,chin:5,cardio:3}},
  {id:'fighter-05',asset:'assets/avatars/fighter-avatar-05.png',stats:{power:6,speed:8,chin:2,cardio:4}},
  {id:'fighter-06',asset:'assets/avatars/fighter-avatar-06.png',stats:{power:5,speed:8,chin:3,cardio:4}},
  {id:'fighter-07',asset:'assets/avatars/fighter-avatar-07.png',stats:{power:4,speed:8,chin:4,cardio:4}},
  {id:'fighter-08',asset:'assets/avatars/fighter-avatar-08.png',stats:{power:6,speed:7,chin:5,cardio:2}},
  {id:'fighter-09',asset:'assets/avatars/fighter-avatar-09.png',stats:{power:5,speed:7,chin:6,cardio:2}},
  {id:'fighter-10',asset:'assets/avatars/fighter-avatar-10.png',stats:{power:4,speed:7,chin:7,cardio:2}},
  {id:'fighter-11',asset:'assets/avatars/fighter-avatar-11.png',stats:{power:4,speed:6,chin:8,cardio:2}},
  {id:'fighter-12',asset:'assets/avatars/fighter-avatar-12.png',stats:{power:3,speed:6,chin:8,cardio:3}},
  {id:'fighter-13',asset:'assets/avatars/fighter-avatar-13.png',stats:{power:2,speed:6,chin:8,cardio:4}},
  {id:'fighter-14',asset:'assets/avatars/fighter-avatar-14.png',stats:{power:3,speed:5,chin:7,cardio:5}},
  {id:'fighter-15',asset:'assets/avatars/fighter-avatar-15.png',stats:{power:4,speed:5,chin:6,cardio:5}},
  {id:'fighter-16',asset:'assets/avatars/fighter-avatar-16.png',stats:{power:5,speed:5,chin:5,cardio:5}},
  {id:'fighter-17',asset:'assets/avatars/fighter-avatar-17.png',stats:{power:6,speed:5,chin:4,cardio:5}},
  {id:'fighter-18',asset:'assets/avatars/fighter-avatar-18.png',stats:{power:7,speed:4,chin:3,cardio:6}},
  {id:'fighter-19',asset:'assets/avatars/fighter-avatar-19.png',stats:{power:6,speed:3,chin:4,cardio:7}},
  {id:'fighter-20',asset:'assets/avatars/fighter-avatar-20.png',stats:{power:5,speed:2,chin:5,cardio:8}},
  {id:'fighter-21',asset:'assets/avatars/fighter-avatar-21.png',stats:{power:8,speed:3,chin:6,cardio:3}},
  {id:'fighter-22',asset:'assets/avatars/fighter-avatar-22.png',stats:{power:7,speed:4,chin:6,cardio:3}},
  {id:'fighter-23',asset:'assets/avatars/fighter-avatar-23.png',stats:{power:6,speed:7,chin:4,cardio:3}},
  {id:'fighter-24',asset:'assets/avatars/fighter-avatar-24.png',stats:{power:8,speed:2,chin:8,cardio:2}},
  {id:'fighter-25',asset:'assets/avatars/fighter-avatar-25.png',stats:{power:8,speed:2,chin:7,cardio:3}},
  {id:'fighter-26',asset:'assets/avatars/fighter-avatar-26.png',stats:{power:7,speed:5,chin:6,cardio:2}},
  {id:'fighter-27',asset:'assets/avatars/fighter-avatar-27.png',stats:{power:4,speed:8,chin:3,cardio:5}},
  {id:'fighter-28',asset:'assets/avatars/fighter-avatar-28.png',stats:{power:3,speed:6,chin:5,cardio:6}},
  {id:'fighter-29',asset:'assets/avatars/fighter-avatar-29.png',stats:{power:7,speed:7,chin:4,cardio:2}},
  {id:'fighter-30',asset:'assets/avatars/fighter-avatar-30.png',stats:{power:3,speed:8,chin:4,cardio:5}},
  {id:'fighter-31',asset:'assets/avatars/fighter-avatar-31.png',stats:{power:4,speed:7,chin:3,cardio:6}},
  {id:'fighter-32',asset:'assets/avatars/fighter-avatar-32.png',stats:{power:8,speed:3,chin:7,cardio:2}},
  {id:'fighter-33',asset:'assets/avatars/fighter-avatar-33.png',stats:{power:7,speed:6,chin:5,cardio:2}},
  {id:'fighter-34',asset:'assets/avatars/fighter-avatar-34.png',stats:{power:6,speed:6,chin:3,cardio:5}},
  {id:'fighter-35',asset:'assets/avatars/fighter-avatar-35.png',stats:{power:6,speed:4,chin:7,cardio:3}},
  {id:'fighter-36',asset:'assets/avatars/fighter-avatar-36.png',stats:{power:7,speed:3,chin:5,cardio:5}},
  {id:'fighter-37',asset:'assets/avatars/fighter-avatar-37.png',stats:{power:8,speed:2,chin:6,cardio:4}},
  {id:'fighter-38',asset:'assets/avatars/fighter-avatar-38.png',stats:{power:6,speed:6,chin:5,cardio:3}},
  {id:'fighter-39',asset:'assets/avatars/fighter-avatar-39.png',stats:{power:5,speed:5,chin:8,cardio:2}},
  {id:'fighter-40',asset:'assets/avatars/fighter-avatar-40.png',stats:{power:8,speed:4,chin:6,cardio:2}},
  {id:'fighter-41',asset:'assets/avatars/fighter-avatar-41.png',stats:{power:8,speed:6,chin:4,cardio:2}},
  {id:'fighter-42',asset:'assets/avatars/fighter-avatar-42.png',stats:{power:5,speed:8,chin:5,cardio:2}},
  {id:'fighter-43',asset:'assets/avatars/fighter-avatar-43.png',stats:{power:7,speed:2,chin:4,cardio:7}},
  {id:'fighter-44',asset:'assets/avatars/fighter-avatar-44.png',stats:{power:4,speed:4,chin:5,cardio:7}}
];

const gearItems = [
  // Fight Gear — earned from wins; minLevel controls when an item enters the permanent drop pool.
  {id:'wraps',category:'Fight Gear',name:'Stiff Hand Wraps',icon:'🩹',rarity:'COMMON',minLevel:1,desc:'+1 Power. Your first real piece of kit.',stat:'power',bonus:1},
  {id:'mouth',category:'Fight Gear',name:'Boil-Bite Guard',icon:'🦷',rarity:'COMMON',minLevel:1,desc:'+1 Chin. Keep the teeth you started with.',stat:'chin',bonus:1},
  {id:'mma-shorts',category:'Fight Gear',name:'MMA Shorts',icon:'🩳',assetExt:'jpg',rarity:'COMMON',minLevel:1,desc:'+1 Speed. Flexible fight-night gear built for clean movement.',stat:'speed',bonus:1},
  {id:'rookie-gloves',category:'Fight Gear',name:'Rookie Blue Gloves',icon:'🥊',rarity:'COMMON',minLevel:2,desc:'+2 Power. Entry-level leather, honest pop.',stat:'power',bonus:2},
  {id:'shoes',category:'Fight Gear',name:'Canvas Fight Shoes',icon:'👟',rarity:'COMMON',minLevel:2,desc:'+2 Speed. Better footing in ugly scrambles.',stat:'speed',bonus:2},
  {id:'rope',category:'Fight Gear',name:'Weighted Rope',icon:'➰',rarity:'COMMON',minLevel:2,desc:'+2 Cardio. Deep rounds stop feeling endless.',stat:'cardio',bonus:2},
  {id:'gloves',category:'Fight Gear',name:'Blue Steel Gloves',icon:'🥊',rarity:'RARE',minLevel:4,desc:'+4 Power. The first gloves people notice.',stat:'power',bonus:4},
  {id:'headgear',category:'Fight Gear',name:'Old School Headgear',icon:'🪖',rarity:'RARE',minLevel:4,desc:'+4 Chin. Built like a truck tire.',stat:'chin',bonus:4},
  {id:'blackout-kit',category:'Fight Gear',name:'Blackout Ring Kit',icon:'🩳',rarity:'RARE',minLevel:5,desc:'+3 Speed. Walk out looking like business.',stat:'speed',bonus:3},
  {id:'storm-gloves',category:'Fight Gear',name:'Storm-Cage Gloves',icon:'🥊',rarity:'EPIC',minLevel:7,desc:'+6 Power. Main-card leather with a mean snap.',stat:'power',bonus:6},
  {id:'cobalt-kit',category:'Fight Gear',name:'Cobalt Walkout Set',icon:'🥋',rarity:'EPIC',minLevel:8,desc:'+5 Cardio. Premium cut, lighter movement.',stat:'cardio',bonus:5},
  {id:'champ-gloves',category:'Fight Gear',name:'Championship Gloves',icon:'🥊',rarity:'LEGENDARY',minLevel:11,desc:'+9 Power. Gold-trimmed and level-gated for a reason.',stat:'power',bonus:9},
  {id:'main-event-kit',category:'Fight Gear',name:'Main Event Ring Gear',icon:'🩳',rarity:'LEGENDARY',minLevel:13,desc:'+8 Speed. Cameras, sponsors, and no cheap fabric.',stat:'speed',bonus:8},

  // Bling — increases follower payouts
  {id:'bourbon',category:'Bling',name:'Small-Batch Bourbon',icon:'🥃',rarity:'COMMON',minLevel:1,desc:'+1% followers from fight wins. Save it for after the fight.',prestige:1},
  {id:'steel-chain',category:'Bling',name:'Steel Chain',icon:'⛓️',rarity:'RARE',minLevel:2,desc:'+3% followers from fight wins.',prestige:3},
  {id:'cuban-cigars',category:'Bling',name:'Cuban Cigars',icon:'🚬',rarity:'RARE',minLevel:4,desc:'+5% followers from fight wins. Victory-lounge material.',prestige:5},
  {id:'blue-watch',category:'Bling',name:'Blue-Face Watch',icon:'⌚',rarity:'RARE',minLevel:3,desc:'+5% followers from fight wins.',prestige:5},
  {id:'gold-necklace',category:'Bling',name:'Heavy Gold Necklace',icon:'📿',rarity:'EPIC',minLevel:5,desc:'+8% followers from fight wins.',prestige:8},
  {id:'fur-coat',category:'Bling',name:'Full-Length Fur Coat',icon:'🧥',rarity:'EPIC',minLevel:7,desc:'+10% followers from fight wins. Every entrance becomes a photo op.',prestige:10},
  {id:'diamond-grill',category:'Bling',name:'Diamond Grill',icon:'😁',rarity:'EPIC',minLevel:6,desc:'+10% followers from fight wins. Smile for the face-off cameras.',prestige:10},
  {id:'champ-ring',category:'Bling',name:'Cage Champion Ring',icon:'💍',rarity:'LEGENDARY',minLevel:7,desc:'+12% followers from fight wins.',prestige:12},
  {id:'diamond-watch',category:'Bling',name:'Diamond Fight Watch',icon:'⌚',rarity:'LEGENDARY',minLevel:10,desc:'+18% followers from fight wins.',prestige:18},
  {id:'designer-sunglasses',category:'Bling',name:'Designer Sunglasses',icon:'🕶️',rarity:'RARE',minLevel:3,desc:'+4% followers from fight wins. Cameras flash; you never blink.',prestige:4},
  {id:'diamond-cluster-ring',category:'Bling',name:'Diamond Cluster Ring',icon:'💍',rarity:'EPIC',minLevel:8,desc:'+12% followers from fight wins. A full face of championship-grade ice.',prestige:12},
  {id:'ice-ring',category:'Bling',name:'Iced-Out Signet Ring',icon:'💎',rarity:'LEGENDARY',minLevel:13,desc:'+25% followers from fight wins.',prestige:25},

  // Lifestyle — improves passive health recovery; Energy is restored only in whole battery segments.
  {id:'tennis-shoes',category:'Lifestyle',name:'Fresh Tennis Shoes',icon:'👟',rarity:'COMMON',minLevel:1,desc:'+0.02 Health every 15 seconds. Roadwork hurts a little less.',healthRegen:.02},
  {id:'energy-drink',category:'Lifestyle',name:'Energy Drink',icon:'⚡',assetExt:'jpg',rarity:'COMMON',minLevel:1,desc:'+0.02 Health every 15 seconds. Does not restore Energy.',healthRegen:.02},
  {id:'small-gym-dog',category:'Lifestyle',name:'Small Gym Dog',icon:'🐶',rarity:'COMMON',minLevel:1,desc:'A little corner companion. +0.01 Health every 15 seconds.',healthRegen:.01},
  {id:'victory-bucket',category:'Lifestyle',name:'Victory Chicken Bucket',icon:'🍗',rarity:'COMMON',minLevel:1,desc:'A post-fight feast. +0.02 Health every 15 seconds.',healthRegen:.02},
  {id:'fight-fuel-protein',category:'Lifestyle',name:'ALLMAX ISOFLEX',icon:'🥤',rarity:'COMMON',minLevel:2,desc:'Protein recovery between fights. +0.03 Health every 15 seconds.',healthRegen:.03,sponsored:true,brand:'ALLMAX ISOFLEX',sponsorDescription:'Chocolate whey isolate with 27g protein, 0g sugar and 75 servings. Gluten free, soy free and low lactose.',sponsorDisclosure:'AFFILIATE QR · Cage Grind may earn from qualifying purchases.',qrAsset:'assets/icons/fight-fuel-protein-qr.png?v=2.5.208'},
  {id:'dog',category:'Lifestyle',name:'Gym Dog',icon:'🐕',rarity:'RARE',minLevel:3,desc:'The gym mascot keeps camp lighter. +0.03 Health every 15 seconds.',healthRegen:.03},
  {id:'flagship-phone',category:'Lifestyle',name:'Flagship Phone',icon:'📱',rarity:'RARE',minLevel:3,desc:'Sleep tracking, camp planning, no excuses. +0.04 Health every 15 seconds.',healthRegen:.04},
  {id:'shrimp-cocktail',category:'Lifestyle',name:'Victory Shrimp Cocktail',icon:'🍤',rarity:'RARE',minLevel:3,desc:'Cold seafood after a hot fight. +0.04 Health every 15 seconds.',healthRegen:.04},
  {id:'meal-plan',category:'Lifestyle',name:'Fight Camp Meal Plan',icon:'🥩',rarity:'EPIC',minLevel:4,desc:'+0.08 Health every 15 seconds.',healthRegen:.08},
  {id:'hot-tub',category:'Lifestyle',name:'Backyard Hot Tub',icon:'🛁',rarity:'EPIC',minLevel:6,desc:'+0.14 Health every 15 seconds.',healthRegen:.14},
  {id:'home-gym',category:'Lifestyle',name:'Private Home Gym',icon:'🏋️',rarity:'LEGENDARY',minLevel:8,desc:'+0.15 Health every 15 seconds.',healthRegen:.15},
  {id:'concert-grand',category:'Lifestyle',name:'Concert Grand Piano',icon:'🎹',rarity:'LEGENDARY',minLevel:10,desc:'A champion learns to switch off. +0.18 Health every 15 seconds.',healthRegen:.18},
  {id:'chef',category:'Lifestyle',name:'Full-Time Fight Chef',icon:'👨‍🍳',rarity:'LEGENDARY',minLevel:11,desc:'+0.30 Health every 15 seconds.',healthRegen:.30},

  // Property & rides — money and prestige
  {id:'used-car',category:'Property & Rides',name:'Used Car',icon:'🚗',rarity:'COMMON',minLevel:1,desc:'+1% fight money. It starts most of the time.',cashBonus:1},
  {id:'sky-blue-scooter',category:'Property & Rides',name:'Sky Blue Scooter',icon:'🛵',rarity:'COMMON',minLevel:2,desc:'+1% fight money and +1% fight followers. Cheap wheels, loud arrival.',cashBonus:1,prestige:1},
  {id:'midnight-cruiser',category:'Property & Rides',name:'Midnight Cruiser',icon:'🏍️',rarity:'RARE',minLevel:4,desc:'+2% fight money and +3% fight followers. Built for the long road.',cashBonus:2,prestige:3},
  {id:'apartment',category:'Property & Rides',name:'Downtown Apartment',icon:'🏢',rarity:'EPIC',minLevel:5,desc:'+3% fight money. You finally leave the gym couch.',cashBonus:3},
  {id:'redline-superbike',category:'Property & Rides',name:'Redline Superbike',icon:'🏍️',rarity:'EPIC',minLevel:7,desc:'+5% fight money and +6% fight followers. The parking lot hears you coming.',cashBonus:5,prestige:6},
  {id:'performance-jet-ski',category:'Property & Rides',name:'Performance Jet Ski',icon:'🌊',rarity:'RARE',minLevel:4,desc:'+2% fight money and +3% fight followers. Camp now includes open-water recovery.',cashBonus:2,prestige:3},
  {id:'coastal-speedboat',category:'Property & Rides',name:'Coastal Speedboat',icon:'🚤',rarity:'EPIC',minLevel:7,desc:'+5% fight money and +6% fight followers. Fast water, faster entrances.',cashBonus:5,prestige:6},
  {id:'sports-car',category:'Property & Rides',name:'Blue Sports Car',icon:'🏎️',rarity:'LEGENDARY',minLevel:8,desc:'+7% fight money and +5% fight followers.',cashBonus:7,prestige:5},
  {id:'house',category:'Property & Rides',name:'Modern Fighter House',icon:'🏠',rarity:'LEGENDARY',minLevel:10,desc:'+10% fight money and +0.15 Health every 15 seconds.',cashBonus:10,healthRegen:.15},
  {id:'supercar',category:'Property & Rides',name:'Midnight Supercar',icon:'🏁',rarity:'LEGENDARY',minLevel:13,desc:'+15% fight money and +12% fight followers.',cashBonus:15,prestige:12},
  {id:'luxury-yacht',category:'Property & Rides',name:'Luxury Yacht',icon:'🛥️',rarity:'LEGENDARY',minLevel:14,desc:'+16% fight money, +18% fight followers, and +0.08 Health every 15 seconds.',cashBonus:16,prestige:18,healthRegen:.08},
  {id:'private-jet',category:'Property & Rides',name:'Private Jet',icon:'✈️',rarity:'LEGENDARY',minLevel:15,desc:'+20% fight money, +15% fight followers, and +0.10 Health every 15 seconds.',cashBonus:20,prestige:15,healthRegen:.10},
  {id:'mansion',category:'Property & Rides',name:'Champion Mansion',icon:'🏰',rarity:'LEGENDARY',minLevel:16,desc:'+25% fight money, +20% fight followers, and +0.27 Health every 15 seconds.',cashBonus:25,prestige:20,healthRegen:.27}
];

const trainDefs = [
  {id:'heavy-bag-rounds',icon:'🥊',title:'Heavy Bag Rounds',text:'Power work. Hooks get meaner.',stat:'power',cost:8,gain:1,sessions:1},
  {id:'slip-rope-drill',icon:'⚡',title:'Slip Rope Drill',text:'Speed work. Hands come back faster.',stat:'speed',cost:8,gain:1,sessions:1},
  {id:'body-conditioning',icon:'🧱',title:'Body Conditioning',text:'Chin work. Learn to stay upright.',stat:'chin',cost:10,gain:1,sessions:1},
  {id:'roadwork-at-dawn',icon:'🫁',title:'Roadwork at Dawn',text:'Cardio work. Bigger stamina pool.',stat:'cardio',cost:9,gain:1,sessions:1}
];

const sparringDefs = [
  {id:'light-sparring',tier:'light',icon:'🥋',title:'Technical Sparring',text:'Controlled technical rounds. Improve one random skill without taking Health damage.',cost:25,gain:1,skills:1,meterSeconds:2},
  {id:'medium-sparring',tier:'medium',asset:'hard-sparring',icon:'🥊',title:'Live Sparring',text:'Live rounds with real contact. Improve one random skill by two points and lose 1–25 Health.',cost:50,gain:2,skills:1,damage:[1,25],meterSeconds:4},
  {id:'heavy-sparring',tier:'heavy',icon:'🤼',title:'Hard Sparring',text:'A punishing full test. Improve every skill by one point and lose 25–50 Health.',cost:75,gain:1,skills:4,damage:[25,50],meterSeconds:6}
];

const trainingInjuryDefs = [
  {id:'knee',name:'Sprained Knee',icon:'🦵'},
  {id:'shoulder',name:'Strained Shoulder',icon:'💪'},
  {id:'elbow',name:'Hyperextended Elbow',icon:'🦾'},
  {id:'ribs',name:'Bruised Ribs',icon:'🩻'},
  {id:'ankle',name:'Twisted Ankle',icon:'🦶'},
  {id:'back',name:'Lower-Back Strain',icon:'⚠️'},
  {id:'hand',name:'Cut Hand',icon:'🩹'},
  {id:'neck',name:'Neck Strain',icon:'🤕'}
];

const hustleDefs = [
  {id:'unload-freight',icon:'📦',title:'Unload Freight',text:'Honest work. Low risk, low glamour.',cost:25,cash:[55,90],meterSeconds:2},
  {id:'nightclub-door',icon:'🚪',title:'Nightclub Door',text:'Look scary for four hours.',cost:25,cash:[85,135],meterSeconds:2},
  {id:'corner-gym-cleanup',icon:'🔧',title:'Corner Gym Cleanup',text:'Mop sweat. Find loose change.',cost:25,cash:[35,70],meterSeconds:2},
  {id:'rideshare-driver',asset:'rideshare-driver',extension:'jpg',icon:'🚗',title:'Rideshare Driver',text:'Drive a random 12–32 mile route at $3 per mile.',cost:25,miles:[12,32],ratePerMile:3,meterSeconds:2}
];

const horseRaceProfiles = [
  {id:'midnight-bell',name:'Midnight Bell',clue:'Fast from the gate.',style:'front',color:'#63d4ff'},
  {id:'southpaw-sally',name:'Southpaw Sally',clue:'Strong through the final stretch.',style:'closer',color:'#ff6b72'},
  {id:'neon-thunder',name:'Neon Thunder',clue:'Explosive pace, uneven form.',style:'volatile',color:'#d38cff'},
  {id:'iron-hoof',name:'Iron Hoof',clue:'Steady from wire to wire.',style:'steady',color:'#c9d3df'},
  {id:'desert-ghost',name:'Desert Ghost',clue:'Patient runner with a late kick.',style:'closer',color:'#f2c46d'},
  {id:'final-round',name:'Final Round',clue:'Likes to control the early pace.',style:'front',color:'#67dfaa'},
  {id:'blue-corner',name:'Blue Corner',clue:'Reliable when the pack tightens.',style:'steady',color:'#538dff'},
  {id:'knockout-rose',name:'Knockout Rose',clue:'Dangerous burst, difficult to read.',style:'volatile',color:'#ff76bd'},
  {id:'long-count',name:'Long Count',clue:'Built to keep grinding late.',style:'closer',color:'#f08c55'},
  {id:'main-event',name:'Main Event',clue:'Usually breaks clean and leads early.',style:'front',color:'#ffe05d'},
  {id:'phoenix-fire',name:'Phoenix Fire',clue:'Can rally after a slow opening.',style:'closer',color:'#ff934f'},
  {id:'cage-rattler',name:'Cage Rattler',clue:'Unpredictable but never out of it.',style:'volatile',color:'#8ce36f'}
];

const recoveryDefs = [
  {id:'rest',icon:'🔋',title:'Rest',text:'Take ten seconds and restore one Energy battery segment.',energy:25,health:0,feeBase:0,feePerLevel:0,meterSeconds:10,freeRest:true},
  {id:'ice-bath',icon:'🧊',title:'Ice Bath',text:'Cold recovery restores 10 Health.',energy:0,health:10,meterSeconds:2},
  {id:'massage',icon:'💆',title:'Sports Massage',text:'Hands-on recovery restores 25 Health.',energy:0,health:25,meterSeconds:4},
  {id:'cryotherapy',icon:'❄️',title:'Cryotherapy',text:'Premium recovery restores 50 Health.',energy:0,health:50,meterSeconds:5}
];

const publicityDefs = [
  {id:'podcast',icon:'🎙️',title:'Local Fight Podcast',text:'Tell stories, call your shot, and turn listeners into followers.',minLevel:3,minFans:200,cost:25,cash:[80,190],fans:[25,75],payout:'$80–190',meterSeconds:2},
  {id:'autographs',icon:'✍️',title:'Autograph Signing',text:'Choose $0–$50 per autograph. Price controls turnout, money, and follower reaction.',minLevel:4,minFans:300,cost:25,autograph:true,payout:'UNKNOWN',meterSeconds:3},
  {id:'trade-show',icon:'🎟️',title:'Trade Show Appearance',text:'Meet supporters at a combat-sports booth and turn handshakes into followers.',minLevel:5,minFans:750,cost:25,cash:[350,900],fans:[70,190],payout:'$350–900',meterSeconds:3},
  {id:'commercial',icon:'🎬',title:'Regional Commercial',text:'Shoot an ad. Solid payday with a chance for the clip to go viral.',minLevel:6,minFans:1500,cost:25,cash:[900,2400],fans:[120,360],viral:.18,payout:'$900–2.4K',meterSeconds:4},
  {id:'expo',icon:'🏟️',title:'National Fitness Expo',text:'Featured guest appearance with photos, interviews, and a packed signing line.',minLevel:8,minFans:5000,cost:25,cash:[3500,8000],fans:[450,1100],payout:'$3.5K–8K',meterSeconds:5},
  {id:'tv-spot',icon:'📺',title:'Prime-Time Sports Segment',text:'National television appearance. One good quote can change your career.',minLevel:10,minFans:15000,cost:25,cash:[9000,18000],fans:[1200,3000],viral:.28,payout:'$9K–18K',meterSeconds:6}
];

const endorsementDefs = [
  {id:'bobs-auto',icon:'🔧',brand:"Bob's Auto Shop",product:'Local mechanic and hometown fight sponsor',minLevel:2,minFans:0,signing:100,perFight:40,fansPerFight:5,fights:3},
  {id:'garys-bar-grill',icon:'🔥',brand:"Gary's Bar & Grill",product:'Neighborhood bar, grill, and fight-night sponsor',minLevel:3,minFans:500,signing:300,perFight:90,fansPerFight:12,fights:3},
  {id:'volt',icon:'⚡',brand:'Surge Core',product:'Performance energy drink',minLevel:4,minFans:2500,signing:1200,perFight:350,fansPerFight:35,fights:4},
  {id:'ironhide',icon:'🥊',brand:'Ironhide Athletics',product:'Gloves and training apparel',minLevel:6,minFans:10000,signing:5500,perFight:1100,fansPerFight:95,fights:5},
  {id:'apex-wireless',icon:'📡',brand:'Apex Wireless',product:'Phones and wireless service',minLevel:8,minFans:30000,signing:18000,perFight:3200,fansPerFight:240,fights:6},
  {id:'northline-auto',icon:'🏎️',brand:'Northline Auto',product:'Performance cars',minLevel:10,minFans:80000,signing:65000,perFight:9500,fansPerFight:650,fights:7},
  {id:'titan-global',icon:'🌐',brand:'Titan Global',product:'Worldwide lifestyle campaign',minLevel:13,minFans:200000,signing:250000,perFight:30000,fansPerFight:2200,fights:8}
];

const fightMomentDefs = {
  opponentHurt:{title:'YOU HAVE THEM HURT',prompt:'Your opponent is retreating with their guard broken.',choices:[
    {id:'swarm',label:'SWARM FOR THE FINISH',risk:'HIGH RISK',stat:'power',base:.54,styles:['striker'],success:{damage:14},fail:{selfDamage:8}},
    {id:'pick',label:'PICK YOUR SHOTS',risk:'SAFE',stat:'speed',base:.78,styles:['striker'],success:{damage:8},fail:{selfDamage:2}},
    {id:'level',label:'CHANGE LEVELS',risk:'CONTROL',stat:'cardio',base:.65,styles:['grappler'],success:{damage:4,control:38,takedown:1},fail:{selfDamage:3}}
  ]},
  playerHurt:{title:'YOU ARE BADLY HURT',prompt:'Your opponent closes in, looking for the finish.',choices:[
    {id:'shell',label:'SHELL UP & RECOVER',risk:'SAFE',stat:'chin',base:.80,styles:['striker','grappler'],success:{control:12},fail:{selfDamage:4}},
    {id:'clinch',label:'FORCE THE CLINCH',risk:'CONTROL',stat:'cardio',base:.66,styles:['grappler'],success:{control:32,takedown:1},fail:{selfDamage:6}},
    {id:'fire',label:'FIRE BACK',risk:'HIGH RISK',stat:'power',base:.48,styles:['striker'],success:{damage:13},fail:{selfDamage:11}}
  ]},
  opponentShot:{title:'THEY SHOOT ON YOUR HIPS',prompt:'The takedown is coming. Make the read now.',choices:[
    {id:'sprawl',label:'SPRAWL & RESET',risk:'SAFE',stat:'cardio',base:.76,styles:['grappler'],success:{control:18},fail:{oppControl:18}},
    {id:'guillotine',label:'ATTACK THE GUILLOTINE',risk:'FINISH HUNT',stat:'speed',base:.50,styles:['grappler'],success:{damage:10,control:34},fail:{oppControl:34}},
    {id:'knee',label:'MEET THEM WITH A KNEE',risk:'HIGH RISK',stat:'power',base:.46,styles:['striker'],success:{damage:15},fail:{selfDamage:7,oppControl:24}}
  ]},
  topControl:{title:'YOU SECURE TOP POSITION',prompt:'Your opponent is pinned beneath you. Choose the priority.',choices:[
    {id:'ground',label:'GROUND-AND-POUND',risk:'DAMAGE',stat:'power',base:.63,styles:['striker','grappler'],success:{damage:11,control:18},fail:{control:8}},
    {id:'advance',label:'ADVANCE POSITION',risk:'CONTROL',stat:'speed',base:.70,styles:['grappler'],success:{damage:5,control:42},fail:{control:14}},
    {id:'stand',label:'LET THEM UP',risk:'SAFE RESET',stat:'cardio',base:.88,styles:['striker'],success:{damage:5},fail:{}}
  ]},
  underPressure:{title:'YOUR BACK HITS THE FENCE',prompt:'Your opponent is taking away the space to escape.',choices:[
    {id:'circle',label:'CIRCLE INTO OPEN SPACE',risk:'SAFE',stat:'speed',base:.76,styles:['striker'],success:{damage:4},fail:{selfDamage:3}},
    {id:'reverse',label:'FIGHT FOR THE REVERSAL',risk:'CONTROL',stat:'cardio',base:.61,styles:['grappler'],success:{control:30},fail:{oppControl:22}},
    {id:'trade',label:'BITE DOWN & TRADE',risk:'HIGH RISK',stat:'chin',base:.50,styles:['striker'],success:{damage:12},fail:{selfDamage:10}}
  ]},
  tactical:{title:'THE ROUND IS IN THE BALANCE',prompt:'The pace settles near the midpoint. Choose where to take the fight.',choices:[
    {id:'pressure',label:'RAISE THE PRESSURE',risk:'DAMAGE',stat:'power',base:.61,styles:['striker'],success:{damage:9},fail:{selfDamage:5}},
    {id:'counter',label:'DRAW OUT A COUNTER',risk:'PRECISION',stat:'speed',base:.68,styles:['striker'],success:{damage:8},fail:{selfDamage:3}},
    {id:'grapple',label:'CHANGE LEVELS',risk:'CONTROL',stat:'cardio',base:.63,styles:['grappler'],success:{damage:3,control:34,takedown:1},fail:{oppControl:14}}
  ]}
};

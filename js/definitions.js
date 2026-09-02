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
  {id:'rope',category:'Fight Gear',name:'Weighted Rope',icon:'➰',rarity:'COMMON',minLevel:2,desc:'+2 Cardio. Energy recharges every 4 seconds while equipped.',stat:'cardio',bonus:2,energyRecoverySpeed:1000},
  {id:'kettle-bell',category:'Fight Gear',name:'Kettlebell',icon:'🏋️',rarity:'COMMON',minLevel:2,desc:'+2 Power. Old iron builds honest strength.',stat:'power',bonus:2},
  {id:'gloves',category:'Fight Gear',name:'Blue Steel Gloves',icon:'🥊',rarity:'RARE',minLevel:4,desc:'+4 Power. The first gloves people notice.',stat:'power',bonus:4},
  {id:'headgear',category:'Fight Gear',name:'Old School Headgear',icon:'🪖',rarity:'RARE',minLevel:4,desc:'+4 Chin. Built like a truck tire.',stat:'chin',bonus:4},
  {id:'blackout-kit',category:'Fight Gear',name:'Blackout Ring Kit',icon:'🩳',rarity:'RARE',minLevel:5,desc:'+3 Speed. Walk out looking like business.',stat:'speed',bonus:3},
  {id:'storm-gloves',category:'Fight Gear',name:'Storm-Cage Gloves',icon:'🥊',rarity:'EPIC',minLevel:7,desc:'+6 Power. Main-card leather with a mean snap.',stat:'power',bonus:6},
  {id:'cobalt-kit',category:'Fight Gear',name:'Cobalt Walkout Set',icon:'🥋',rarity:'EPIC',minLevel:8,desc:'+5 Cardio. Energy recharges every 4 seconds while equipped.',stat:'cardio',bonus:5,energyRecoverySpeed:1000},
  {id:'champ-gloves',category:'Fight Gear',name:'Championship Gloves',icon:'🥊',rarity:'LEGENDARY',minLevel:11,desc:'+9 Power. Gold-trimmed and level-gated for a reason.',stat:'power',bonus:9},
  {id:'main-event-kit',category:'Fight Gear',name:'Main Event Ring Gear',icon:'🩳',rarity:'LEGENDARY',minLevel:13,desc:'+3 Power, Speed, Chin, and Cardio.',bonuses:{power:3,speed:3,chin:3,cardio:3}},

  // Bling — increases followers earned from fight wins
  {id:'bourbon',category:'Bling',name:'Small-Batch Bourbon',icon:'🥃',rarity:'COMMON',minLevel:1,desc:'+1% followers from fight wins. Save it for after the fight.',prestige:1},
  {id:'steel-chain',category:'Bling',name:'Steel Chain',icon:'⛓️',rarity:'RARE',minLevel:2,desc:'+3% followers from fight wins.',prestige:3},
  {id:'cuban-cigars',category:'Bling',name:'Cuban Cigars',icon:'🚬',rarity:'RARE',minLevel:4,desc:'+5% followers from fight wins. Victory-lounge material.',prestige:5},
  {id:'blue-watch',category:'Bling',name:'Blue-Face Watch',icon:'⌚',rarity:'RARE',minLevel:3,desc:'+5% followers from fight wins.',prestige:5},
  {id:'smart-watch',category:'Bling',name:'Smart Watch',icon:'⌚',rarity:'RARE',minLevel:3,desc:'+4% followers from fight wins. Track the camp and look sharp doing it.',prestige:4},
  {id:'gold-necklace',category:'Bling',name:'Heavy Gold Necklace',icon:'📿',rarity:'EPIC',minLevel:5,desc:'+8% followers from fight wins.',prestige:8},
  {id:'fur-coat',category:'Bling',name:'Full-Length Fur Coat',icon:'🧥',rarity:'EPIC',minLevel:7,desc:'+10% followers from fight wins. Every entrance becomes a photo op.',prestige:10},
  {id:'diamond-grill',category:'Bling',name:'Diamond Grill',icon:'😁',rarity:'EPIC',minLevel:6,desc:'+10% followers from fight wins. Smile for the face-off cameras.',prestige:10},
  {id:'champ-ring',category:'Bling',name:'Cage Champion Ring',icon:'💍',rarity:'LEGENDARY',minLevel:7,desc:'+12% followers from fight wins.',prestige:12},
  {id:'diamond-watch',category:'Bling',name:'Diamond Fight Watch',icon:'⌚',rarity:'LEGENDARY',minLevel:10,desc:'+18% followers from fight wins.',prestige:18},
  {id:'designer-sunglasses',category:'Bling',name:'Designer Sunglasses',icon:'🕶️',rarity:'RARE',minLevel:3,desc:'+4% followers from fight wins. Cameras flash; you never blink.',prestige:4},
  {id:'diamond-cluster-ring',category:'Bling',name:'Diamond Cluster Ring',icon:'💍',rarity:'EPIC',minLevel:8,desc:'+12% followers from fight wins. A full face of championship-grade ice.',prestige:12},
  {id:'ice-ring',category:'Bling',name:'Iced-Out Signet Ring',icon:'💎',rarity:'LEGENDARY',minLevel:13,desc:'+25% followers from fight wins.',prestige:25},

  // Lifestyle — collectible status perks and follower growth.
  {id:'tennis-shoes',category:'Lifestyle',name:'Fresh Tennis Shoes',icon:'👟',rarity:'COMMON',minLevel:1,desc:'+1% followers from fight wins.',prestige:1},
  {id:'energy-drink',category:'Lifestyle',name:'Energy Drink',icon:'⚡',assetExt:'png',rarity:'COMMON',minLevel:1,desc:'+1% followers from fight wins.',prestige:1},
  {id:'small-gym-dog',category:'Lifestyle',name:'Small Gym Dog',icon:'🐶',rarity:'COMMON',minLevel:1,desc:'A little corner companion. +1% followers from fight wins.',prestige:1},
  {id:'victory-bucket',category:'Lifestyle',name:'Victory Chicken Bucket',icon:'🍗',rarity:'COMMON',minLevel:1,desc:'A post-fight feast. +1% followers from fight wins.',prestige:1},
  {id:'hot-coffee',category:'Lifestyle',name:'Hot Coffee',icon:'☕',rarity:'COMMON',minLevel:1,desc:'Early roadwork starts here. +1% followers from fight wins.',prestige:1},
  {id:'iced-coffee',category:'Lifestyle',name:'Iced Coffee',icon:'🥤',rarity:'COMMON',minLevel:1,desc:'Cold caffeine for a long fight camp. +1% followers from fight wins.',prestige:1},
  {id:'tinned-sardines',category:'Lifestyle',name:'Tinned Sardines',icon:'🐟',rarity:'COMMON',minLevel:1,desc:'Old-school corner fuel. +1% followers from fight wins.',prestige:1},
  {id:'dill-pickle',category:'Lifestyle',name:'Dill Pickle',icon:'🥒',rarity:'COMMON',minLevel:1,desc:'Electrolytes reduce Health recovery to one point every 55 seconds.',healthRecoverySpeed:5000},
  {id:'fight-fuel-protein',category:'Lifestyle',name:'ALLMAX ISOFLEX',icon:'🥤',rarity:'COMMON',minLevel:2,desc:'+2% followers from fight wins.',prestige:2,sponsored:true,brand:'ALLMAX ISOFLEX',sponsorDescription:'Chocolate whey isolate with 27g protein, 0g sugar and 75 servings. Gluten free, soy free and low lactose.',sponsorDisclosure:'AFFILIATE QR · Cage Grind may earn from qualifying purchases.',qrAsset:'assets/icons/fight-fuel-protein-qr.png?v=2.7.86'},
  {id:'dog',category:'Lifestyle',name:'Gym Dog',icon:'🐕',rarity:'RARE',minLevel:3,desc:'The gym mascot keeps your corner loose. +3% followers from fight wins.',prestige:3},
  {id:'flagship-phone',category:'Lifestyle',name:'Flagship Phone',icon:'📱',rarity:'RARE',minLevel:3,desc:'+4% followers from fight wins.',prestige:4},
  {id:'shrimp-cocktail',category:'Lifestyle',name:'Victory Shrimp Cocktail',icon:'🍤',rarity:'RARE',minLevel:3,desc:'+4% followers from fight wins.',prestige:4},
  {id:'white-loafers',category:'Lifestyle',name:'White Loafers',icon:'👞',rarity:'RARE',minLevel:3,desc:'Clean shoes for the post-fight cameras. +4% followers from fight wins.',prestige:4},
  {id:'meal-plan',category:'Lifestyle',name:'Fight Camp Meal Plan',icon:'🥩',rarity:'EPIC',minLevel:4,desc:'+6% followers from fight wins.',prestige:6},
  {id:'hot-tub',category:'Lifestyle',name:'Backyard Hot Tub',icon:'🛁',rarity:'EPIC',minLevel:6,desc:'+8% followers from fight wins.',prestige:8},
  {id:'home-gym',category:'Lifestyle',name:'Private Home Gym',icon:'🏋️',rarity:'LEGENDARY',minLevel:8,desc:'+10% followers from fight wins.',prestige:10},
  {id:'concert-grand',category:'Lifestyle',name:'Concert Grand Piano',icon:'🎹',rarity:'LEGENDARY',minLevel:10,desc:'A champion learns to switch off. +12% followers from fight wins.',prestige:12},
  {id:'chef',category:'Lifestyle',name:'Full-Time Fight Chef',icon:'👨‍🍳',rarity:'LEGENDARY',minLevel:11,desc:'+15% followers from fight wins.',prestige:15},

  // Property & rides — career status and follower reach
  {id:'used-car',category:'Property & Rides',name:'Used Car',icon:'🚗',rarity:'COMMON',minLevel:1,desc:'+1% followers from fight wins. It starts most of the time.',prestige:1},
  {id:'sky-blue-scooter',category:'Property & Rides',name:'Sky Blue Scooter',icon:'🛵',rarity:'COMMON',minLevel:2,desc:'+2% followers from fight wins. Cheap wheels, loud arrival.',prestige:2},
  {id:'midnight-cruiser',category:'Property & Rides',name:'Midnight Cruiser',icon:'🏍️',rarity:'RARE',minLevel:4,desc:'+3% followers from fight wins. Built for the long road.',prestige:3},
  {id:'apartment',category:'Property & Rides',name:'Downtown Apartment',icon:'🏢',rarity:'EPIC',minLevel:5,desc:'+5% followers from fight wins. You finally leave the gym couch.',prestige:5},
  {id:'redline-superbike',category:'Property & Rides',name:'Redline Superbike',icon:'🏍️',rarity:'EPIC',minLevel:7,desc:'+6% followers from fight wins. The parking lot hears you coming.',prestige:6},
  {id:'performance-jet-ski',category:'Property & Rides',name:'Performance Jet Ski',icon:'🌊',rarity:'RARE',minLevel:4,desc:'+3% followers from fight wins. Fast water, faster clips.',prestige:3},
  {id:'coastal-speedboat',category:'Property & Rides',name:'Coastal Speedboat',icon:'🚤',rarity:'EPIC',minLevel:7,desc:'+6% followers from fight wins. Every entrance gets noticed.',prestige:6},
  {id:'sports-car',category:'Property & Rides',name:'Blue Sports Car',icon:'🏎️',rarity:'EPIC',minLevel:8,desc:'+8% followers from fight wins.',prestige:8},
  {id:'house',category:'Property & Rides',name:'Modern Fighter House',icon:'🏠',rarity:'EPIC',minLevel:10,desc:'+10% followers from fight wins.',prestige:10},
  {id:'supercar',category:'Property & Rides',name:'Midnight Supercar',icon:'🏁',rarity:'EPIC',minLevel:13,desc:'+12% followers from fight wins.',prestige:12},
  {id:'luxury-yacht',category:'Property & Rides',name:'Luxury Yacht',icon:'🛥️',rarity:'LEGENDARY',minLevel:14,desc:'+18% followers from fight wins.',prestige:18},
  {id:'private-jet',category:'Property & Rides',name:'Private Jet',icon:'✈️',rarity:'LEGENDARY',minLevel:15,desc:'+20% followers from fight wins.',prestige:20},
  {id:'mansion',category:'Property & Rides',name:'Champion Mansion',icon:'🏰',rarity:'LEGENDARY',minLevel:16,desc:'+25% followers from fight wins.',prestige:25}
];

const gearCategoryEffectByRarity={
  COMMON:{auraBonus:1,healthRecoverySpeed:2500,energyRecoverySpeed:100},
  RARE:{auraBonus:2,healthRecoverySpeed:5000,energyRecoverySpeed:200},
  EPIC:{auraBonus:3,healthRecoverySpeed:7500,energyRecoverySpeed:300},
  LEGENDARY:{auraBonus:5,healthRecoverySpeed:10000,energyRecoverySpeed:500}
};
for(const item of gearItems){
  const effect=gearCategoryEffectByRarity[item.rarity]||gearCategoryEffectByRarity.COMMON;
  delete item.prestige;
  delete item.auraBonus;
  delete item.healthRecoverySpeed;
  delete item.energyRecoverySpeed;
  if(item.category==='Fight Gear')item.desc=item.desc.split('.')[0]+'.';
  else if(item.category==='Bling'){item.auraBonus=effect.auraBonus;item.desc=`+${effect.auraBonus} effective Aura while equipped.`}
  else if(item.category==='Lifestyle'){item.healthRecoverySpeed=effect.healthRecoverySpeed;item.desc=`Health recovery is ${effect.healthRecoverySpeed/1000} seconds faster while equipped.`}
  else if(item.category==='Property & Rides'){item.energyRecoverySpeed=effect.energyRecoverySpeed;item.desc=`Energy recovery is ${(effect.energyRecoverySpeed/1000).toFixed(1)} seconds faster while equipped.`}
}

const endorsementDefs = [
  {id:'bobs-auto',icon:'🔧',brand:"Bob's Auto Shop",product:'Local mechanic and hometown fight sponsor',followersRequired:0},
  {id:'garys-bar-grill',icon:'🔥',brand:"Gary's Bar & Grill",product:'Neighborhood bar, grill, and fight-night sponsor',followersRequired:500},
  {id:'volt',icon:'⚡',brand:'Surge Core',product:'Performance energy drink',followersRequired:2500},
  {id:'ironhide',icon:'🥊',brand:'Ironhide Athletics',product:'Gloves and fight apparel',followersRequired:10000},
  {id:'apex-wireless',icon:'📡',brand:'Apex Wireless',product:'Phones and wireless service',followersRequired:30000},
  {id:'northline-auto',icon:'🏎️',brand:'Northline Auto',product:'Performance cars',followersRequired:80000},
  {id:'titan-global',icon:'🌐',brand:'Titan Global',product:'Worldwide lifestyle campaign',followersRequired:200000}
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

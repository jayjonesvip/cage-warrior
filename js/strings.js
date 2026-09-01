globalThis.CAGE_STRINGS = {
  fighterIdentity: {
colors: [
  'Crimson', 'Scarlet', 'Obsidian', 'Blood', 'Chrome', 'Iron', 'Steel',
  'Shadow', 'Midnight', 'Neon', 'Venom', 'Phantom', 'Atomic', 'Rebel',
  'Savage', 'Brutal', 'Turbo', 'Electric', 'Thunder', 'Storm', 'Frost',
  'Blazing', 'Cosmic', 'Relentless', 'Gritty', 'Wicked', 'Silent',
  'Heavy', 'Prime', 'Rogue', 'Wild', 'Cold', 'Mad', 'True',
  'Golden', 'Silver', 'Bronze', 'Copper', 'Emerald', 'Azure', 'Indigo',
  'Violet', 'Purple', 'Orange', 'Red', 'Black', 'Blue', 'Green'
],

origins: [
  'American', 'Mexican', 'Brazilian', 'Russian', 'Irish', 'British',
  'Scottish', 'Canadian', 'Cuban', 'Jamaican', 'Nigerian', 'Filipino',
  'Thai', 'Japanese', 'Korean', 'Chinese', 'Australian', 'Dutch',
  'Polish', 'German', 'French', 'Italian', 'Spanish', 'Portuguese',
  'Colombian', 'Argentinian', 'Ukrainian', 'Georgian', 'Armenian',
  'Samoan', 'Tongan', 'Hawaiian', 'Puerto Rican', 'Dominican'
],

weather: [
  'Storm', 'Thunder', 'Lightning', 'Tempest', 'Hurricane', 'Tornado',
  'Cyclone', 'Typhoon', 'Blizzard', 'Avalanche', 'Wildfire', 'Firestorm',
  'Monsoon', 'Downpour', 'Cloudburst', 'Whirlwind', 'Duststorm',
  'Heatwave', 'Frost', 'Hail', 'Pressure', 'Wind', 'Vortex',
  'Blackout', 'Riptide', 'Aftershock', 'Quake', 'Surge', 'Flash'
],

animals: [
  'Viper', 'Cobra', 'Mamba', 'Python', 'Tiger', 'Lion', 'Panther',
  'Jaguar', 'Leopard', 'Wolf', 'Bear', 'Shark', 'Orca', 'Hawk',
  'Falcon', 'Eagle', 'Raven', 'Scorpion', 'Rhino', 'Bull', 'Boar',
  'Crocodile', 'Alligator', 'Wolverine', 'Barracuda', 'Piranha',
  'Raptor', 'Jackal', 'Coyote', 'Hyena', 'Komodo', 'Mantis',
  'Hornet', 'Wasp', 'Dragon', 'Phoenix', 'Reaper'
],

combat: [
  'Hammer', 'Bomber', 'Fist', 'Claw', 'Crusher', 'Puncher', 'Slugger',
  'Bruiser', 'Haymaker', 'Knuckle', 'Mauler', 'Wrecker', 'Grinder',
  'Striker', 'Kicker', 'Choker', 'Grappler', 'Hunter', 'Warrior',
  'Gladiator', 'Cannon', 'Blade', 'Anvil', 'Breaker', 'Monster',
  'Demon', 'Devil', 'Destroyer', 'Assassin', 'Executioner', 'Butcher',
  'Hitman', 'Enforcer', 'Obliterator', 'Rampage', 'Onslaught', 'Warpath'
],
    cityCodes: {
      phoenix:'PHX','los-angeles':'LAX',chicago:'CHI','new-york':'NYC',miami:'MIA',houston:'HOU',cleveland:'CLE',seattle:'SEA','new-orleans':'NOLA',hawaii:'HNL',boston:'BOS',atlanta:'ATL','san-francisco':'SFO',denver:'DEN','tampa-bay':'TPA',philadelphia:'PHL','san-antonio':'SAT','las-vegas':'LAS',portland:'PDX',baltimore:'BWI'
    }
  },

opponentNames: {
  countries: [
    // Existing (cleaned)
    {code:'USA', first:['Randy','Aaron','Caleb','Bryce','Marcus','Damon','Darius','Jonah','Silas','Tate','Cole','Jaxon','Reid','Trent'], last:['Jones','Anderson','Carter','Brown','Davis','Jackson','Johnson','Miller','Smith','Williams','Hayes','Brooks','Reed','Fox']},
    {code:'MX', first:['Mario','Carlos','Diego','Javier','Mateo','Rafael','Tomas','Hector','Cruz','Nico','Emiliano','Santiago'], last:['Lopez','Garcia','Hernandez','Martinez','Rodriguez','Gonzalez','Castillo','Reyes','Santos','Diaz','Vargas','Morales']},
    {code:'RUS', first:['Aleksei','Anton','Dmitri','Ivan','Mikhail','Nikolai','Pavel','Roman','Sergei','Viktor','Yuri','Kirill'], last:['Ivanov','Petrov','Smirnov','Volkov','Kuznetsov','Fedorov','Kozlov','Lebedev','Morozov','Orlov','Popov','Sokolov','Zaitsev','Karpov']},
    {code:'BRA', first:['Adriano','Anderson','Bruno','Caio','Edson','Fabricio','Joao','Jose','Rafael','Thiago','Gabriel','Matheus'], last:['Silva','Souza','Oliveira','Pereira','Almeida','Costa','Nunes','Santos','Ferreira','Ribeiro','Lima','Barbosa']},
    {code:'CAN', first:['Adam','Alex','Brandon','Cole','Elias','Marc','Patrick','Rory','Tristan','Xavier','Logan','Noah'], last:['Campbell','Fraser','Martin','Tremblay','Roy','Gagnon','Wilson','Clarke','Bennett','Foster','MacDonald','Scott']},
    {code:'IRL', first:['Aidan','Cian','Conor','Declan','Eamon','Finn','Liam','Niall','Ronan','Sean','Cillian','Oisin'], last:['Murphy','Kelly','Byrne','Doyle','Gallagher','Kennedy','Walsh','Brennan','Quinn','OConnor','Ryan','Fitzgerald']},
    {code:'GBR', first:['Alfie','Callum','Elliot','George','Harry','Jack','Lewis','Oliver','Reece','Theo','Finlay','Kai'], last:['Baker','Clarke','Cooper','Davies','Evans','Fletcher','Harris','Morgan','Taylor','Walker','Hughes','Price']},
    {code:'JPN', first:['Akira','Daichi','Haruto','Hiro','Kenji','Kenta','Riku','Satoshi','Takumi','Yuto','Ren','Sora'], last:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Sasaki','Matsumoto']},
    {code:'KOR', first:['DongHyun','JiHoon','JunSeo','MinHo','MinJun','SangMin','SeoJun','TaeHyun','WooJin','YoungHo','HyunWoo','JaeMin'], last:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh']},
    {code:'NGA', first:['Ade','Chidi','Emeka','Kelechi','Kunle','Nnamdi','Obinna','Tayo','Uche','Victor','Chukwu','Ike'], last:['Okafor','Adeyemi','Balogun','Eze','Nwosu','Obi','Okoye','Adebayo','Chukwu','Ojo','Okonkwo','Ibrahim']},
    {code:'THA', first:['Anan','Arthit','Chai','Kiet','Niran','Preecha','Sakda','Somchai','Surin','Wichai','Peerapat','Thanawat'], last:['Boonmee','Chaiya','Khamla','Prasert','Rattanak','Saelim','Somsak','Srisai','Thongchai','Wongsa','Siriwong','Phan']},
    {code:'PHI', first:['Angelo','Carlo','Dante','Enzo','Gabriel','Jose','Marco','Paolo','Ramon','Rico','Miguel','Andres'], last:['Aquino','Bautista','Castillo','Cruz','DelaRosa','Mendoza','Navarro','Ramos','Reyes','Santos','Villanueva','Torres']},
    {code:'CUB', first:['Alejandro','Camilo','Ernesto','Jorge','Luis','Miguel','Orlando','Raul','Rene','Yordan','Yoan','Dayron'], last:['Alvarez','Cabrera','Diaz','Fernandez','Gomez','Hernandez','Martinez','Perez','Rodriguez','Suarez','Valdez','Mesa']},
    {code:'PR', first:['Adrian','Angel','Emilio','Felix','Julio','Luis','Marcos','Ramon','Ricardo','Xavier','Diego','Sebastian'], last:['Colon','Delgado','Figueroa','Flores','Morales','Ortiz','Rivera','Rosario','Santiago','Vega','Rios','Pagan']},
    {code:'AUS', first:['Blake','Callan','Cooper','Dylan','Ethan','Harrison','Lachlan','Mason','Nate','Tyson','Jett','Riley'], last:['Bailey','Collins','Dawson','Fisher','Gray','Mitchell','Parker','Reid','Turner','Wright','Hayes','Brooks']},
    {code:'POL', first:['Adam','Bartosz','Dawid','Jakub','Kamil','Lukasz','Marcin','Mateusz','Pawel','Tomasz','Kacper','Szymon'], last:['Kowalski','Nowak','Wisniewski','Wojcik','Kowalczyk','Kaminski','Lewandowski','Zielinski','Szymanski','Dabrowski','Piotrowski','Grabowski']},

    // New countries
    {code:'GEO', first:['Giorgi','Luka','Nika','Tornike','Irakli','Zurab','Levan','Shota','Davit','Aleksandre'], last:['Kvirikashvili','Maisuradze','Tavadze','Gogoladze','Kiknadze','Lobzhanidze','Chikadze','Shavdatuashvili','Berdzenishvili','Kharabadze']},
    {code:'ARM', first:['Armen','Gor','Hayk','Levon','Narek','Suren','Tigran','Vardan','Arman','David'], last:['Petrosyan','Sargsyan','Hakobyan','Grigoryan','Avetisyan','Karapetyan','Mkrtchyan','Hovhannisyan','Gevorgyan','Manukyan']},
    {code:'COL', first:['Andres','Camilo','Daniel','Felipe','Juan','Luis','Miguel','Nicolas','Santiago','Sebastian'], last:['Garcia','Rodriguez','Martinez','Lopez','Hernandez','Gonzalez','Perez','Sanchez','Ramirez','Torres']},
    {code:'ARG', first:['Agustin','Bruno','Facundo','Franco','Joaquin','Lucas','Mateo','Nicolas','Santiago','Tomas'], last:['Gonzalez','Rodriguez','Fernandez','Lopez','Martinez','Perez','Sanchez','Romero','Diaz','Alvarez']},
    {code:'NED', first:['Bas','Daan','Finn','Jasper','Lars','Luuk','Max','Noah','Sem','Thijs'], last:['DeJong','Jansen','DeVries','Bakker','Visser','Smit','Meijer','DeBoer','Mulder','Bos']},
    {code:'SAM', first:['Afa','Junior','Leki','Malo','Manu','Pele','Sione','Tala','Tevita','Toa'], last:['Afoa','Faamausili','Leota','Mataele','Pulu','Samoa','Tofa','Umaga','Vea','Williams']}
  ]
},
  fightCommentary: {
    hit: {
      jab: ['{A} snaps a jab through the guard.','{A} doubles the jab and finds the mark.','{A} touches {D} with a sharp lead hand.'],
      cross: ['{A} drives a straight right down the middle.','{A} lands the cross and backs {D} toward the fence.','{A} cracks {D} with a clean right hand.'],
      hook: ['{A} whips a hook around the guard.','{A} digs a heavy hook into the ribs.','{A} lands a compact left hook in the pocket.'],
      kick: ['{A} chops the lead leg with a hard kick.','{A} lands a body kick with a thud.','{A} fires a kick that turns {D} sideways.'],
      takedown: ['{A} changes levels and finishes the takedown.','{A} runs {D} to the fence and drags the fight down.','{A} catches the hips and plants {D} on the canvas.']
    },
    miss: {
      jab: ['{D} slips the jab and resets.','{A} paws with the lead hand but cannot find the target.'],
      cross: ['{D} ducks under the right hand.','{A} loads up and swings past the target.'],
      hook: ['{D} rolls under the hook and circles away.','{A} throws wide; {D} is already gone.'],
      kick: ['{D} checks the kick and holds position.','{A} misses the kick and has to scramble back into stance.'],
      takedown: ['{D} sprawls hard and shuts down the shot.','{A} shoots from too far out; {D} stuffs it.']
    }
  },


  social: {
    profiles: {
      media: {author:'CageReporter',handle:'@CageReporter',tone:'media',avatar:'assets/cage-reporter.jpg?v=2.7.46',verified:true,bio:'Cage Grind’s official fight desk. Publishes contract signings and official fight results.'},
      ceo: {author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo',avatar:'assets/cage-grind-ceo.jpg?v=2.7.46',verified:true,bio:'Founder and CEO of Cage Grind. Builds the cards, signs the title fights, and decides which performances deserve the biggest stage.'},
      promoter: {author:'Mack Vale',handle:'@MackMakesFights',tone:'promoter'},
      gym: {author:'Iron District Gym',handle:'@IronDistrict',tone:'gym'},
      rival: {author:'Fight Night Rival',handle:'@NoEasyRounds',tone:'rival'}
    },
    usernames: {
      fan: ['FightFan99','MMA4Life','CageSideSara','FiveRoundFaithful','SouthpawSam','GroundGameGuru','JustBleedJay','UppercutUpdates'],
      hater: ['TapeWatcher88','ScorecardBandit','CasualTakeKing','NoChinChecked','OverratedAlert','SplitDecisionDan','BenchCoach77','FlukeWinPolice']
    },
    account: [
      {profile:'player',text:'Hello, fight fans! Stay tuned—the climb starts now.'},
      {profile:'fan',text:'First follow. Let’s see where this goes.'},
      {profile:'promoter',text:'Account is live. Now give the timeline something worth talking about, {name}.'}
    ],
    contractSigning:{profile:'media',text:'SIGNED: @{name} has put pen to paper on a Cage Grind contract. The new {archetype} out of {city} is officially on the roster.'},
    ceo: {
      debut:{profile:'ceo',text:'Welcome to Cage Grind, @{name}. Build a record worth putting under the bright lights.'},
      performanceBonus:{profile:'ceo',text:'I noticed that performance, @{name}. A bonus is already on the way.'}
    },
    sponsorSigning:'Welcome @{name} to the {brand} team. We are proud to back the next stage of the climb.',
    sponsorReturning:'Welcome back, @{name}. Your following is above the {brand} milestone again, and the partnership is back on.',
    sponsorDropped:'{brand} has dropped @{name} after the fighter fell below its follower requirement. Rebuild the audience and the door can reopen.',
  cycles: {
  fightWin: [
    {profile:'media', text:'RESULT: {name} defeats {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'{name} takes the win over {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'OFFICIAL: {name} gets past {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'{name} leaves with the victory after defeating {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'Another win for {name}. {opponent} falls by {finish}.{titleSuffix}'},
    {profile:'media', text:'{name} handles business against {opponent}, earning the win by {finish}.{titleSuffix}'},
    {profile:'rival', author:'{opponent}', text:'Enjoy the win, {name}. If they book it again, I know what changes.'},
    {profile:'fan', text:'That was the kind of performance that turns a prospect into must-watch television. {name} showed up.'}
  ],
  fightInjuredWin: [
    {profile:'media', text:'FIGHTING HURT: {name} battled through a {injury} and still beat {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'{name} carried a {injury} into the cage and walked out with a win over {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'INJURED BUT VICTORIOUS: A {injury} did not stop {name} from finishing {opponent}.{titleSuffix}'},
    {profile:'media', text:'{name} fought through a {injury} and still found a way past {opponent} by {finish}.{titleSuffix}'},
    {profile:'media', text:'Despite a {injury}, {name} gets the job done against {opponent} by {finish}.{titleSuffix}'}
  ],
  fightWinHater: {profile:'hater', text:'Everybody relax. One win does not make {name} unbeatable. Book the rematch.'},
  fightStreakHeadline: [
    {profile:'media', text:'WIN STREAK: {name} has now won {winStreak} straight. The division has to pay attention.'},
    {profile:'media', text:'{winStreak} IN A ROW: {name} keeps rolling. The rest of the division is on notice.'},
    {profile:'media', text:'The run continues. {name} pushes the winning streak to {winStreak}.'},
    {profile:'media', text:'{name} extends the streak to {winStreak} wins. Momentum is hard to ignore.'}
  ],
  fightStreakHater: {profile:'hater', text:'{winStreak} straight? Wake me up when {name} beats someone I picked.'},
  fightLoss: [
    {profile:'media', text:'RESULT: {name} falls to {opponent} by {finish}.'},
    {profile:'media', text:'{opponent} defeats {name} by {finish}.'},
    {profile:'media', text:'OFFICIAL: {name} comes up short against {opponent} by {finish}.'},
    {profile:'media', text:'{opponent} hands {name} a loss by {finish}.'},
    {profile:'media', text:'{name} comes up short as {opponent} wins by {finish}. Attention turns to the next camp.'},
    {profile:'rival', author:'{opponent}', text:'Respect for taking the fight, {name}. But tonight belonged to me.'},
    {profile:'hater', text:'The hype train needed brakes. {name} just found them.'},
    {profile:'fan', text:'Losses happen. Still here, still following, and waiting for the comeback.'}
  ]
},
interactions: {
  callout: {
    label: 'CALL THEM OUT',
    messages: [
      '@{handle}, keep winning. I want your name next to mine when the matchmakers finally pull the trigger.',
      '@{handle}, the record looks clean. Let’s see what happens when the cage door shuts.',
      '@{handle}, no shade — but this is a fight the crowd would lose their minds over.',
      'Matchmakers, put @{handle} across from me. I’ll take care of the rest.',
      '@{handle}, you’ve got my attention. Now go earn the contract with my name on it.',
      '@{handle}, your style against mine sells every seat in the building.',
      'I respect the climb, @{handle}, but I’d still take that matchup tomorrow.',
      '@{handle}, tell your team to keep the phone charged. My side is interested.',
      'The division won’t stop talking about @{handle}. I’d rather settle it in the cage.',
      '@{handle}, you bring the record. I’ll bring the pressure. Let’s make it official.',
      '@{handle}, I’m not asking for a favor. I’m asking for a fight.',
      'Stop ducking the conversation, @{handle}. Let’s run it back in the cage.',
      '@{handle}, the fans already know this one makes sense. Time for the matchmakers to catch up.',
      'I’ve been watching, @{handle}. Now I want the real version — in there with me.'
    ]
  },
  respect: {
    label: 'SHOW RESPECT',
    messages: [
      '@{handle}, respect from one fighter to another. Keep climbing.',
      'Different gyms, same hard road. Real respect to @{handle}.',
      'You can chase the same belt and still respect the work. Salute, @{handle}.',
      '@{handle} knows what this life actually costs. Nothing but respect.',
      'No callout today — just respect for the work @{handle} is putting in.',
      'We might cross paths someday, @{handle}. Until then, respect for the climb.',
      'Records get the headlines. Consistency earns the respect. @{handle} has both.',
      'Every fighter knows the hours nobody sees. Salute to @{handle} for putting them in.',
      '@{targetName}, keep representing your city and your gym the right way.',
      'There’s room for rivalry and respect. @{handle} has earned the second one today.',
      '@{handle} is doing it the hard way and still looking sharp. Respect.',
      'Clean wins, quiet work. That’s how @{handle} moves. Salute.',
      'Nobody handed @{handle} anything. That grind deserves recognition.',
      'Happy to see @{handle} getting the flowers while they’re still fighting. Respect.'
    ]
  }
},
  },
  corner: {
    states: {
      ahead: {
        label:'PROTECT THE LEAD',
        advice:'You banked the last round. Stay sharp and do not give them the mistake they need.'
      },
      behind: {
        label:"YOU'RE BEHIND — GO TAKE IT",
        advice:'That round got away from us. Raise the pace and make the judges remember the finish.'
      },
      even: {
        label:'TOO CLOSE TO CALL',
        advice:'Nobody owns this fight yet. Win the next five minutes clean.'
      }
    },
    matchups: {
      striker: {
        advice:"They're built to keep this standing and punish you with combinations. Break the range before the power builds.",
        plan:'grappler',action:'TAKE AWAY THE STAND-UP',
        description:'Close distance, change levels, and force the fight into grappling exchanges.'
      },
      grappler: {
        advice:"They're driving every exchange toward takedowns and control. Protect your hips and make every entry cost them.",
        plan:'striker',action:'KEEP IT STANDING',
        description:'Own the range, punish level changes, and deny settled grappling positions.'
      }
    }
  },

  ticker: [
    'On-level wins earn one Attribute Point. Beat a higher-level fighter and earn two. Assign them on the Fight page.',
    'Fast pace is an investment, kid. Bring better cardio than the other guy or pay interest late.',
    'Energy charges one point every five seconds. Empty means no clearance; anything above zero gets you booked.',
    'Health recovers one point every minute. Commission still wants 20 before a bout.',
    'Fresh on-level contenders pay full XP. One same-day runback pays half; later wins pay none.',
    'Beating a lower-level fighter costs five percent of your followers. Fans expect you to fight up, not down.',
    'Set the plan before the walkout: pace, offense, and whether you trust your style or adapt.',
    'Adapting takes focus, kid. Round one reads him, round two adjusts, round three owns the answer.',
    'No shop, no shortcuts. Beat fighters at your level or higher and fill the Victory Pack meter.',
    'Four Victory Pack segments earn the sealed pack. A big performance can fill two.',
    'Duplicate on the first draw? The locker rerolls once in the same rarity. After that, the result stands.',
    'One Daily Drop, every day. Guaranteed collectible. Do not ask who packed it.',
    'Followers open sponsor doors—and falling below a milestone can cost you the deal. Build back and they can return.',
    'The right equipped gear can cut Energy charging from five seconds to four. Best perk only.',
    'Followers build your status. Hype makes sure the division notices.',
    'CageGrindCEO: Records get attention. Finishes get phone calls.',
    'A title only unlocks the champion. Nobody mails you a belt—you take it from the man holding it.',
    'CageGrindCEO: Win when the lights are brightest and I will know your name.',
    'If the corner offers a towel or a haymaker, pick the ending you can live with.'
  ]
};

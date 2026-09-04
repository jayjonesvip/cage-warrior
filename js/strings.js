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
      media: {author:'CageReporter',handle:'@CageReporter',tone:'media',avatar:'assets/cage-reporter.jpg?v=2.7.109',verified:true,bio:'Cage Grind’s official fight desk. Publishes contract signings and official fight results.'},
      ceo: {author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo',avatar:'assets/cage-grind-ceo.jpg?v=2.7.109',verified:true,bio:'Founder and CEO of Cage Grind. Builds the cards, signs the title fights, and decides which performances deserve the biggest stage.'},
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
    {profile:'media', text:'RESULT: {name} defeats {opponent} by {finish}. Clean result, no excuses.{titleSuffix}'},
    {profile:'media', text:'{name} takes the win over {opponent} by {finish}. That was control, not luck.{titleSuffix}'},
    {profile:'media', text:'OFFICIAL: {name} gets past {opponent} by {finish}. The division should take note.{titleSuffix}'},
    {profile:'media', text:'{name} leaves with the victory after defeating {opponent} by {finish}. A professional night from start to finish.{titleSuffix}'},
    {profile:'media', text:'Another win for {name}. {opponent} falls by {finish}, and the résumé keeps getting harder to dismiss.{titleSuffix}'},
    {profile:'media', text:'{name} handles business against {opponent}, earning the win by {finish}. Exactly what a serious contender is supposed to do.{titleSuffix}'},
    {profile:'media', text:'STATEMENT MADE: {name} defeats {opponent} via {finish}. That performance will improve the matchmaking options.{titleSuffix}'},
    {profile:'media', text:'No controversy tonight. {name} beats {opponent} by {finish} and earns every bit of the result.{titleSuffix}'},
    {profile:'media', text:'{name} defeats {opponent} by {finish}. The result was decisive; the next assignment should be tougher.{titleSuffix}'},
    {profile:'media', text:'CageReporter verdict: {name} was the better fighter tonight, getting past {opponent} via {finish}.{titleSuffix}'},
    {profile:'rival', author:'{opponent}', text:'Enjoy the win, {name}. If they book it again, I know what changes.'},
    {profile:'fan', text:'That was the kind of performance that turns a prospect into must-watch television. {name} showed up.'}
  ],
  fightWinHater: {profile:'hater', text:'Everybody relax. One win does not make {name} unbeatable. Book the rematch.'},
  lowerLevelWin: [
    {profile:'media', text:'FAN BACKLASH: {name} beat lower-level {opponent}, but lost {followersLost} followers. The audience wants tougher competition.'},
    {profile:'media', text:'CROWD REACTION: A win is official, but {name} dropped {followersLost} followers after facing down a level. Time to step up.'},
    {profile:'media', text:'The record improves, the audience does not. {name} lost {followersLost} followers after beating lower-level {opponent}.'},
    {profile:'media', text:'Cage Grind fans are not impressed by the matchmaking. {name} beat {opponent} and lost {followersLost} followers in the backlash.'},
    {profile:'media', text:'RESULT WITH A WARNING: {name} gets the win over {opponent}, but {followersLost} followers leave. The next opponent needs to be tougher.'},
    {profile:'media', text:'The fans have spoken: {name} lost {followersLost} followers after taking a lower-level fight. More challenging competition is expected.'},
    {profile:'media', text:'WIN, THEN BACKLASH: {name} handled {opponent}, but the level gap cost {followersLost} followers.'},
    {profile:'media', text:'Level {fighterLevel} {name} defeated Level {opponentLevel} {opponent}. The mismatch cost {followersLost} followers, and fans want a real test next.'},
    {profile:'media', text:'Easy work, expensive choice. {name} beat lower-level {opponent}, then watched {followersLost} followers walk away.'},
    {profile:'media', text:'CageReporter verdict: {name} got the win, but beating down the ladder impressed nobody. The bill was {followersLost} followers.'}
  ],
  fightStreakHeadline: [
    {profile:'media', text:'WIN STREAK: {name} has now won {winStreak} straight. The division has to pay attention.'},
    {profile:'media', text:'{winStreak} IN A ROW: {name} keeps rolling. The rest of the division is on notice.'},
    {profile:'media', text:'The run continues. {name} pushes the winning streak to {winStreak}.'},
    {profile:'media', text:'{name} extends the streak to {winStreak} wins. Momentum is hard to ignore.'},
    {profile:'media', text:'This is no longer one good night. {name} has won {winStreak} straight, and the pattern is obvious.'},
    {profile:'media', text:'{winStreak} consecutive wins for {name}. The division is running out of excuses.'},
    {profile:'media', text:'{name} keeps answering every question. Win number {winStreak} makes the next matchup even more important.'},
    {profile:'media', text:'The streak is real: {name} reaches {winStreak} straight wins and looks more dangerous each time out.'},
    {profile:'media', text:'{name} has stacked {winStreak} wins in a row. Opponents know what is coming and still have not stopped it.'},
    {profile:'media', text:'CageReporter verdict: {winStreak} straight is not a coincidence. {name} has earned a bigger test.'}
  ],
  fightStreakHater: {profile:'hater', text:'{winStreak} straight? Wake me up when {name} beats someone I picked.'},
  fightLoss: [
    {profile:'media', text:'RESULT: {name} falls to {opponent} by {finish}. There is no hiding from that result.'},
    {profile:'media', text:'{opponent} defeats {name} by {finish}. The better fighter won tonight.'},
    {profile:'media', text:'OFFICIAL: {name} comes up short against {opponent} by {finish}. The adjustments never arrived.'},
    {profile:'media', text:'{opponent} hands {name} a loss by {finish}. Back to the gym—this one exposed real holes.'},
    {profile:'media', text:'{name} comes up short as {opponent} wins by {finish}. The next camp needs answers, not excuses.'},
    {profile:'media', text:'No sugarcoating it: {opponent} beats {name} by {finish}. That was a hard lesson under the lights.'},
    {profile:'media', text:'{name} loses to {opponent} by {finish}. The tape will be uncomfortable, which is exactly why it matters.'},
    {profile:'media', text:'Credit where it belongs: {opponent} defeats {name} by {finish} and shuts down the game plan.'},
    {profile:'media', text:'A setback does not erase the climb, but {name} was second best tonight. {opponent} wins by {finish}.'},
    {profile:'media', text:'CageReporter verdict: {name} was beaten clearly by {opponent} via {finish}. The response starts now.'},
    {profile:'rival', author:'{opponent}', text:'Respect for taking the fight, {name}. But tonight belonged to me.'},
    {profile:'hater', text:'The bandwagon needed brakes. {name} just found them.'},
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

  postFightTexts: {
    chance: .32,
    contacts: [
      {id:'wife',name:'Maya',relationship:'WIFE',avatar:'assets/contact-wife.jpg',win:[['That was a good one. You looked calm in there.','Call me when you are clear of medicals.'],['You looked so sharp tonight. I could finally breathe after they raised your hand.','Proud of you. Come home safe.'],['Everyone here was yelling at the screen.','Great win. Now please let the doctors do their job.'],['You did exactly what you said you would do.','I love seeing all that work pay off.'],['I was pacing the entire last round.','Worth it when your hand went up.'],['That looked like the best version of you yet.','Hold onto that feeling.'],['Your phone has not stopped buzzing over here.','Ignore it until you have had a minute to breathe.'],['Clean win. Smart fight. I am impressed.','And yes, I was still nervous the whole time.'],['I could hear the crowd through the television.','You gave them something to remember.'],['Another one in the books.','Come home and let somebody else take care of you tonight.']],loss:[['I watched the whole thing. I am proud of you, win or lose.','Get checked out and come home safe.'],['I know that one hurts. You do not have to talk about it yet.','I am here when you are ready.'],['Forget the cameras and the comments tonight.','Get some rest. We will handle tomorrow together.'],['You gave everything you had. I saw that.','This loss does not get to define you.'],['That one scared me a little.','Please call as soon as the doctor clears you.'],['Take the night off from being a fighter.','Just come home and be with me.'],['I know you are replaying every second already.','You can study it tomorrow. Tonight you recover.'],['You do not have to prove anything to anyone tonight.','I am proud of you for getting back up.'],['A career is longer than one bad result.','We will get through this one too.'],['No speeches. No advice.','Just come home safe.']],titleWin:[['You did it. You actually brought the belt home.','I am so proud of you.'],['World champion. I keep saying it and it still does not feel real.','I love you. Enjoy this moment.'],['You promised me all those late nights would mean something.','You were right, champ.']]},
      {id:'mom',name:'Mom',relationship:'MOM',avatar:'assets/contact-mom.jpg',win:[['I knew you had that fight.','Please tell me you are not too bruised.'],['You were wonderful tonight!','Have you eaten anything since the fight?'],['Your whole family was watching. We are so proud.','Call when you have a quiet minute.'],['You looked strong and confident out there.','I was nervous enough for both of us.'],['Another win! I knew all that training would show.','Now drink some water, please.'],['I recorded the fight even though I watched it live.','I might watch the ending again.'],['You made that look much easier than it felt to your mother.','Very proud of you.'],['Everyone keeps texting me congratulations.','I told them you get your toughness from me.'],['That was such a smart fight.','Your coaches must be thrilled.'],['You won, so now I can finally unclench my hands.','Call me after medicals.']],loss:[['One hard night does not change who you are.','Rest first. Then you can figure out the next one.'],['I wish I could give you a hug through this phone.','You are still my champion.'],['Do not read what strangers are saying tonight.','Listen to your coaches and take care of yourself.'],['I know you are disappointed.','Nothing about tonight makes me less proud of you.'],['Please do not rush back into the gym tomorrow.','Your body needs kindness too.'],['The result hurt, but watching you keep fighting made me proud.','Come back when you are ready.'],['You have survived harder things than one loss.','Call your mother when you can.'],['I turned the television off before the interviews.','You do not owe anyone an explanation tonight.'],['Promise me you will listen to the doctors.','The next fight can wait.'],['I love you. That is the whole message.','Everything else can wait until tomorrow.']],titleWin:[['My baby is the world champion!','I have already told everyone. Twice.'],['I cried when they wrapped that belt around you.','Your father would be so proud.'],['WORLD CHAMPION! I knew you could do it.','We are planning a family dinner whether you like it or not.']]},
      {id:'grandma',name:'Grandma',relationship:'GRANDMA',avatar:'assets/contact-grandma.jpg',win:[['I saw you on my phone! Very exciting.','You still need to eat something after all that.'],['You won again! I clapped so loudly the neighbor checked on me.','Come visit when your face looks normal.'],['That referee finally did something useful and raised your hand.','Very proud of you, sweetheart.'],['You hit that man very hard. I suppose that was the idea.','Congratulations, dear.'],['The announcer kept shouting your name.','I told the television I already knew who you were.'],['Another victory! Your grandfather would have loved that one.','Do not forget to call.'],['You looked very serious in there.','Smile now. You won.'],['I stayed awake for the whole fight this time.','It was worth missing my program.'],['The people in the crowd seemed to like you.','They have good taste.'],['Very good work tonight.','I put an extra plate aside for you.']],loss:[['That other fighter was very rude.','Come see me when you feel better.'],['I did not like that result at all.','I still think you were the better-looking fighter.'],['Your mother says you are fine, but call me yourself.','I made soup.'],['I think the referee should have given you another chance.','But nobody asks Grandma.'],['That was difficult to watch, sweetheart.','Please take care of yourself.'],['You cannot win every time. Apparently.','Come visit and I will cheer you up.'],['I turned it off when they announced the other name.','The ending was incorrect.'],['Do not worry about those commentators.','They have never been in a cage.'],['You looked tired. Are they feeding you properly?','I can fix that.'],['One loss is nothing compared with everything you have accomplished.','I am still bragging about you.']],titleWin:[['They gave you a very large belt.','Bring it by so I can get a picture.'],['I saw the shiny belt! Is it real gold?','Do not leave it lying around.'],['Champion of the whole world sounds important.','You are still taking out my trash when you visit.']]},
      {id:'tommy',name:'Tommy',relationship:'BROTHER',avatar:'assets/contact-brother-tommy.png',win:[['That finish was nasty. The whole room went crazy.','Do not start acting famous on me now.'],['You absolutely cooked that guy.','I am clipping the finish before the broadcast even ends.'],['Clean work. Even I have nothing sarcastic to say.','Enjoy it before the group chat gets unbearable.'],['That was cold. I almost felt bad for the other guy.','Almost.'],['You made him look like he won a contest to be there.','Great work.'],['I called the finish before the announcers did.','Obviously your talent runs in the family.'],['Another win and somehow your ego still fits through the cage door.','Proud of you, seriously.'],['The slow-motion replay is even better.','I have watched it six times.'],['You owe me money for doubting that game plan.','I accept cash or cage-side tickets.'],['That crowd was loud for you tonight.','Keep stacking wins like that.']],loss:[['Bad night. That is all it was.','You know I am with you for the comeback.'],['That sucked. I am not going to pretend it did not.','Next one is yours.'],['Delete the apps and ignore everybody tonight.','I will roast you later. Right now I have your back.'],['He got you tonight. It happens.','Do not let him keep you tomorrow.'],['I already muted the loudest idiots online.','You focus on getting healthy.'],['You looked one adjustment away the whole fight.','We will see a different result next time.'],['No jokes tonight. That was a rough one.','Call me if you need anything.'],['I know exactly how mad you are right now.','Use it later, not tonight.'],['The group chat is on lockdown until further notice.','I have handled it.'],['You took the risk. I respect that.','Now we build the comeback.']],titleWin:[['WORLD CHAMP. I cannot believe it.','Nobody gets to call me the successful brother anymore.'],['You actually did it, you maniac.','Save me a seat near the belt.'],['The family group chat is completely out of control.','Worth it. Congratulations, champ.']]},
      {id:'carl',name:'Agent Carl',relationship:'AGENT',avatar:'assets/contact-agent-carl.png',win:[['Strong performance. People are calling.','Do not commit to anything until we talk.'],['That win moved the market. Exactly what we needed.','I have three calls waiting.'],['Good result and better timing. The matchmakers noticed.','Stay available tomorrow morning.'],['Excellent work. That performance gives us leverage.','Let me use it.'],['The finish is already moving across every highlight account.','This is a good night for business.'],['You handled the assignment exactly right.','Our next conversation just got more interesting.'],['Sponsors noticed the win. So did the matchmakers.','Keep tonight clean and professional.'],['That was the kind of performance that changes a contract.','I will make the calls.'],['The numbers are moving in the right direction.','Do not get distracted by the noise.'],['Win confirmed. Medicals first, media second.','Call me before you leave the arena.']],loss:[['Keep your phone close. We control the story from here.','One result does not erase your value.'],['No interviews tonight. Let me handle the requests.','We regroup in the morning.'],['The loss is official. The damage to your career is not.','Do not post anything until we speak.'],['Tough result. We keep the response short and disciplined.','I will handle the calls.'],['There will be questions tomorrow.','Tonight you recover and say nothing.'],['The market overreacts to everything. This will settle.','Focus on your health.'],['We need the medical report before we discuss another booking.','Do not rush the timeline.'],['This is a setback, not a collapse.','The comeback story starts with how we handle tonight.'],['Your value was built over a career, not one scorecard.','Let me protect it.'],['No excuses and no emotional posts.','We review the tape, then choose the next move.']],titleWin:[['Congratulations, champ. Your phone is about to become unusable.','Call me before you promise anybody anything.'],['The belt changes every conversation from this point forward.','We meet first thing tomorrow.'],['World champion. Now the real business starts.','Enjoy tonight. I will protect tomorrow.']]}
    ]
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
    'Every pack reveals an undiscovered collectible from your unlocked pool.',
    'One Daily Drop, every day. Guaranteed collectible. Do not ask who packed it.',
    'Followers open sponsor doors—and falling below a milestone can cost you the deal. Build back and they can return.',
    'The right equipped gear can cut Energy charging from five seconds to four. Best perk only.',
    'Followers measure your audience. Aura measures how strongly the fight world feels your presence.',
    'CageGrindCEO: Records get attention. Finishes get phone calls.',
    'A title only unlocks the champion. Nobody mails you a belt—you take it from the man holding it.',
    'CageGrindCEO: Win when the lights are brightest and I will know your name.',
    'If the corner offers a towel or a haymaker, pick the ending you can live with.'
  ]
};

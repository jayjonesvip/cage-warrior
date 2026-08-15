globalThis.CAGE_STRINGS = {
  fighterIdentity: {
    colors: ['White','Golden','Blue','Red','Black','Silver','Green','Orange','Purple','Crimson','Scarlet','Gray','Bronze','Copper','Indigo','Violet','Azure','Emerald','Dark','Light','Iron','Rogue','Wild','Prime','Lucky','Heavy','Silent','Midnight','Cold','Savage','Wicked','True','Rapid','Mad','Electric','Thunder','Neon','Steel','Shadow','Storm','Venom','Outlaw','Gritty','Relentless','Blazing','Phantom','Cosmic','Fearless','Turbo','Brutal','Atomic','Rebel'],
    origins: ['American','Mexican','Russian','Brazilian','Canadian','Irish','British','Scottish','French','German','Italian','Spanish','Portuguese','Japanese','Korean','Chinese','Thai','Filipino','Nigerian','Cuban','Jamaican','Australian','Dutch','Polish'],
    weather: ['Drizzle','Wind','Pressure','Tornado','Storm','Thunder','Lightning','Blizzard','Cyclone','Hurricane','Tempest','Monsoon','Wildfire','Avalanche','Typhoon','Hail','Frost','Downpour','Heatwave','Duststorm','Cloudburst','Whirlwind','Firestorm'],
    animals: ['Viper','Cobra','Mamba','Python','Tiger','Lion','Panther','Jaguar','Leopard','Wolf','Bear','Shark','Orca','Hawk','Falcon','Eagle','Raven','Scorpion','Rhino','Bull','Boar','Crocodile','Alligator','Wolverine','Barracuda','Piranha','Dog','Cat','Raptor','Mastodon','Jackal','Coyote','Raccoon','Dragon','Goat'],
    combat: ['Hammer','Bomber','Fist','Claw','Crusher','Puncher','Slugger','Bruiser','Haymaker','Knuckle','Mauler','Wrecker','Grinder','Striker','Kicker','Choker','Grappler','Hunter','Warrior','Gladiator','Cannon','Blade','Anvil','Breaker','Monster','Demon','Devil','Destroyer'],
    cityCodes: {
      phoenix:'PHX','los-angeles':'LAX',chicago:'CHI','new-york':'NYC',miami:'MIA',houston:'HOU',cleveland:'CLE',seattle:'SEA','new-orleans':'NOLA',hawaii:'HNL'
    }
  },

  opponentNames: {
    countries: [
      {code:'USA',first:['Randy','Aaron','Caleb','Bryce','Marcus','Damon','Darius','Jonah','Silas','Tate'],last:['Jones','Anderson','Carter','Brown','Davis','Jackson','Johnson','Miller','Smith','Williams']},
      {code:'MX',first:['Mario','Carlos','Diego','Javier','Mateo','Rafael','Tomas','Hector','Cruz','Nico'],last:['Lopez','Garcia','Hernandez','Martinez','Rodriguez','Gonzalez','Castillo','Reyes','Santos','Diaz']},
      {code:'RUS',first:['Aleksei','Anton','Dmitri','Ivan','Mikhail','Nikolai','Pavel','Roman','Sergei','Viktor','Yuri'],last:['Ivanov','Petrov','Smirnov','Volkov','Kuznetsov','Fedorov','Kozlov','Lebedev','Morozov','Orlov','Popov','Sokolov','Zaitsev','Karpov']},
      {code:'BRA',first:['Adriano','Anderson','Bruno','Caio','Edson','Fabricio','Joao','Jose','Rafael','Thiago'],last:['Silva','Souza','Oliveira','Pereira','Almeida','Costa','Nunes','Santos','Ferreira','Ribeiro']},
      {code:'CAN',first:['Adam','Alex','Brandon','Cole','Elias','Marc','Patrick','Rory','Tristan','Xavier'],last:['Campbell','Fraser','Martin','Tremblay','Roy','Gagnon','Wilson','Clarke','Bennett','Foster']},
      {code:'IRL',first:['Aidan','Cian','Conor','Declan','Eamon','Finn','Liam','Niall','Ronan','Sean'],last:['Murphy','Kelly','Byrne','Doyle','Gallagher','Kennedy','Walsh','Brennan','Quinn','OConnor']},
      {code:'GBR',first:['Alfie','Callum','Elliot','George','Harry','Jack','Lewis','Oliver','Reece','Theo'],last:['Baker','Clarke','Cooper','Davies','Evans','Fletcher','Harris','Morgan','Taylor','Walker']},
      {code:'JPN',first:['Akira','Daichi','Haruto','Hiro','Kenji','Kenta','Riku','Satoshi','Takumi','Yuto'],last:['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato']},
      {code:'KOR',first:['DongHyun','JiHoon','JunSeo','MinHo','MinJun','SangMin','SeoJun','TaeHyun','WooJin','YoungHo'],last:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim']},
      {code:'NGA',first:['Ade','Chidi','Emeka','Kelechi','Kunle','Nnamdi','Obinna','Tayo','Uche','Victor'],last:['Okafor','Adeyemi','Balogun','Eze','Nwosu','Obi','Okoye','Adebayo','Chukwu','Ojo']},
      {code:'THA',first:['Anan','Arthit','Chai','Kiet','Niran','Preecha','Sakda','Somchai','Surin','Wichai'],last:['Boonmee','Chaiya','Khamla','Prasert','Rattanak','Saelim','Somsak','Srisai','Thongchai','Wongsa']},
      {code:'PHI',first:['Angelo','Carlo','Dante','Enzo','Gabriel','Jose','Marco','Paolo','Ramon','Rico'],last:['Aquino','Bautista','Castillo','Cruz','DelaRosa','Mendoza','Navarro','Ramos','Reyes','Santos']},
      {code:'CUB',first:['Alejandro','Camilo','Ernesto','Jorge','Luis','Miguel','Orlando','Raul','Rene','Yordan'],last:['Alvarez','Cabrera','Diaz','Fernandez','Gomez','Hernandez','Martinez','Perez','Rodriguez','Suarez']},
      {code:'PR',first:['Adrian','Angel','Emilio','Felix','Julio','Luis','Marcos','Ramon','Ricardo','Xavier'],last:['Colon','Delgado','Figueroa','Flores','Morales','Ortiz','Rivera','Rosario','Santiago','Vega']},
      {code:'AUS',first:['Blake','Callan','Cooper','Dylan','Ethan','Harrison','Lachlan','Mason','Nate','Tyson'],last:['Bailey','Collins','Dawson','Fisher','Gray','Mitchell','Parker','Reid','Turner','Wright']},
      {code:'POL',first:['Adam','Bartosz','Dawid','Jakub','Kamil','Lukasz','Marcin','Mateusz','Pawel','Tomasz'],last:['Kowalski','Nowak','Wisniewski','Wojcik','Kowalczyk','Kaminski','Lewandowski','Zielinski','Szymanski','Dabrowski']}
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

  fightFocus: {
    contacts: [
      {id:'mom',name:'MOM',avatar:'assets/contact-mom.jpg?v=2.5.74',ignoreDelta:-4,ignoreText:'You leave Mom’s message unread, but keep wondering why she texted tonight.',messages:[
        {id:'mom-proud',text:'We are so proud of you. Go show them who you are. ❤️',focus:100},
        {id:'mom-watch-party',text:'The whole family is here in your shirts. This house is LOUD. We love you!',delta:12},
        {id:'mom-dad-advice',text:'Dad says keep your hands up, breathe, and call us after you win.',delta:7},
        {id:'mom-first-gloves',text:'Found the photo of your first gloves. You have wanted this since you were little.',delta:10},
        {id:'mom-prayer',text:'I said a prayer for you. You are covered. Fight free tonight.',delta:8},
        {id:'mom-dinner',text:'Your favorite meal is waiting here. Handle business and come home hungry.',delta:4},
        {id:'mom-first-coach',text:'Your first coach called. He said you look ready for this moment.',delta:9},
        {id:'mom-unconditional',text:'Win or lose, nothing changes here. We love you more than any result.',minimum:95},
        {id:'mom-dad-fell',text:'Dad fell and broke his shoulder. He is okay, but come by after the fight.',focus:50},
        {id:'mom-grandma-er',text:'Grandma is in the emergency room. We do not know much yet. I am sorry.',delta:-20},
        {id:'mom-test-results',text:'The doctor called about my tests. We need to talk when you are done.',delta:-22},
        {id:'mom-sister-accident',text:'Your sister was in a car accident. She is awake. Focus on your fight for now.',delta:-16},
        {id:'mom-dog-missing',text:'The dog got out and we cannot find him anywhere. Everyone is looking.',delta:-14},
        {id:'mom-family-fight',text:'Your brother and Dad are fighting again. They both expect me to fix it.',delta:-11},
        {id:'mom-pipe-burst',text:'A pipe burst at the house. There is water everywhere, but we are handling it.',delta:-7},
        {id:'mom-urgent-call',text:'Call me as soon as you can. It is important. I do not want to put it in a text.',delta:-12}
      ]},
      {id:'wife',name:'WIFE',avatar:'assets/contact-wife.jpg?v=2.5.74',ignoreDelta:-5,ignoreText:'You leave your wife’s message unread, and the notification follows you toward the cage.',messages:[
        {id:'wife-good-luck',text:'Good luck, baby. Trust your work. We love you and we are already proud. ❤️',delta:10},
        {id:'wife-sexy-photo',text:'[Photo] Win fast. I have plans for you when you get home. 😘',delta:12},
        {id:'wife-kids-video',text:'The kids made you a video. They keep yelling “BRING HOME THE WIN!”',delta:15},
        {id:'wife-pregnant-happy',text:'I took three tests. I’m pregnant. We are having another baby. ❤️',delta:18},
        {id:'wife-food',text:'Can you pick up tacos on the way home? Champion duties. 🌮',delta:3},
        {id:'wife-kids-love',text:'The kids said you are the toughest person in the whole world. No pressure.',delta:10},
        {id:'wife-vacation',text:'Finish this and I am booking us two days where nobody can call you.',delta:8},
        {id:'wife-believes',text:'I have seen every hard day that got you here. You belong in that cage.',minimum:95},
        {id:'wife-cheating',text:'I saw the messages. Do not lie to me again. We are dealing with this tonight.',delta:-25},
        {id:'wife-kids-crying',text:'Both kids are crying because you are not here. I cannot calm them down.',delta:-9},
        {id:'wife-pregnant-scared',text:'The test is positive. I am pregnant, and honestly I am scared.',delta:-16},
        {id:'wife-cannot-attend',text:'I am not going to make it to the fight. I am so sorry. Please do not be mad.',delta:-10},
        {id:'wife-bill',text:'The mortgage payment bounced. We are short again, and I do not know what to do.',delta:-12},
        {id:'wife-child-fever',text:'Our youngest has a high fever. I may need to take them to urgent care.',delta:-18},
        {id:'wife-talk',text:'We need to talk when you get home. This cannot keep going the way it has.',delta:-20},
        {id:'wife-car',text:'The car will not start. If you are able, I need you to pick us up afterward.',delta:-6}
      ]},
      {id:'brother-tommy',name:'BROTHER TOMMY',avatar:'assets/contact-brother-tommy.png?v=2.5.74',ignoreDelta:-3,ignoreText:'You leave Tommy’s message unread. With him, that could mean anything.',messages:[
        {id:'tommy-front-row',text:'Good luck. I’m in the front row. I’ll be the loud one.',delta:10},
        {id:'tommy-payback',text:'I got paid, so I’ll finally pay you back after the fight. Every dollar.',delta:8},
        {id:'tommy-family-proud',text:'Everybody is proud of you. Tonight is yours. Go handle it.',minimum:95},
        {id:'tommy-old-gloves',text:'I found your old gloves. You were calling yourself champ before anybody else did.',delta:7},
        {id:'tommy-no-doubt',text:'You have carried me enough. Tonight I’m here for you. No doubt, no fear.',delta:12},
        {id:'tommy-borrow-money',text:'Can I borrow some money? It’s kind of urgent. I’ll explain later.',delta:-10},
        {id:'tommy-wrecked-car',text:'I wrecked your car. I’m okay. The car definitely is not.',delta:-18},
        {id:'tommy-lost-wallet',text:'I lost your wallet. The one with all your cards in it. I’m still looking.',delta:-13},
        {id:'tommy-police',text:'Do you know anybody who can get me out of the police station tonight?',delta:-20},
        {id:'tommy-bet',text:'I bet money I did not have on you tonight. You really need to win.',delta:-16}
      ]},
      {id:'agent-carl',name:'AGENT CARL',avatar:'assets/contact-agent-carl.png?v=2.5.74',ignoreDelta:-2,ignoreText:'You leave Carl on unread, but wonder what deal—or problem—he is sitting on.',messages:[
        {id:'carl-sponsor',text:'Big sponsor in the front row. Put on a show and I can make the phone ring tomorrow.',delta:9},
        {id:'carl-purse',text:'I squeezed another bonus into the deal. Win tonight and the number gets very interesting.',delta:7},
        {id:'carl-fees',text:'Small paperwork issue: my expenses come out before your purse. We’ll discuss the total later.',delta:-12},
        {id:'carl-bad-deal',text:'I may have promised them an immediate rematch if you lose. Do me a favor and don’t lose.',delta:-9}
      ]}
    ]
  },

  social: {
    profiles: {
      media: {author:'CageReporter',handle:'@CageReporter',tone:'media'},
      ceo: {author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo',avatar:'assets/cage-grind-ceo.jpg?v=2.5.74',verified:true,bio:'Founder and CEO of Cage Grind. Builds the cards, signs the title fights, and decides which performances deserve the biggest stage.'},
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
    ceo: {
      debut:{profile:'ceo',text:'Welcome to Cage Grind, @{name}. Build a record worth putting under the bright lights.'},
      performanceBonus:{profile:'ceo',text:'I noticed that performance, @{name}. A bonus is already on the way.'}
    },
    cycles: {
      fightWin: [
        {profile:'media',text:'RESULT: {name} gets past {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'{name} leaves the cage with the win after defeating {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'OFFICIAL: {name} adds another victory over {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'{name} defeats {opponent} by {finish}.{titleSuffix}'},
        {profile:'rival',author:'{opponent}',text:'Enjoy the win, {name}. If they book it again, I know what changes.'},
        {profile:'fan',text:'That was the kind of performance that turns a prospect into must-watch television. {name} showed up.'}
      ],
      fightInjuredWin: [
        {profile:'media',text:'COURAGEOUS OR STUPID? {name} fought through a {injury} and still beat {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'FIGHTING HURT: {name} carried a {injury} into the cage and came out with a {finish} win over {opponent}.{titleSuffix}'},
        {profile:'media',text:'Brave, reckless, or bothâ€”{name} ignored a {injury} and defeated {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'INJURED AND VICTORIOUS: A {injury} did not stop {name} from finishing the job against {opponent}.{titleSuffix}'}
      ],
      fightWinHater: {profile:'hater',text:'Everybody relax. One win does not make {name} unbeatable. Book the rematch.'},
      fightStreakHeadline: [
        {profile:'media',text:'WIN STREAK: {name} has now won {winStreak} straight fights. The division has to pay attention.'},
        {profile:'media',text:'{winStreak} IN A ROW: {name} keeps rolling and the rest of the division is officially on notice.'},
        {profile:'media',text:'The run continues: {name} has pushed the winning streak to {winStreak}.'}
      ],
      fightStreakHater: {profile:'hater',text:'{winStreak} straight? Wake me up when {name} beats someone I picked.'},
      fightLoss: [
        {profile:'media',text:'RESULT: {name} falls to {opponent} by {finish}. Attention now turns to the next camp.'},
        {profile:'media',text:'{name} comes up short as {opponent} earns the {finish} victory.'},
        {profile:'media',text:'OFFICIAL: {opponent} defeats {name} by {finish}.'},
        {profile:'media',text:'{opponent} hands {name} a loss by {finish}. The comeback starts with the response.'},
        {profile:'rival',author:'{opponent}',text:'Respect for taking the fight, {name}. But tonight belonged to me.'},
        {profile:'hater',text:'The hype train needed brakes. {name} just found them.'},
        {profile:'fan',text:'Losses happen. Still here, still following, and waiting for the comeback.'}
      ],
      appearance: [
        {profile:'media',text:'OUTSIDE THE CAGE: {name} stopped by {title} as the profile continues to grow.'},
        {profile:'media',text:'{title} welcomed {name} today for a break from fight-camp business.'},
        {profile:'media',text:'{name} made an appearance on {title}. The fight world is starting to notice.'},
        {profile:'fan',text:'Saw {name} making the rounds today. Good energy and no fake superstar routine.'},
        {profile:'hater',text:'Another appearance? I would rather see {name} book a fight.'}
      ],
      viralAppearance: [
        {profile:'media',text:'TRENDING: The {name} appearance on {title} is taking over the fight timeline.'},
        {profile:'media',text:'{name} went from cage prospect to viral name after a huge moment on {title}.'},
        {profile:'media',text:'{name} made an appearance on {title}. The fight world is starting to notice.'},
        {profile:'fan',text:'That {name} clip is everywhere. The timeline belongs to a cage fighter today.'},
        {profile:'hater',text:'Another appearance? I would rather see {name} book a fight.'}
      ],
      autographFree: [
        {profile:'media',text:'FAN REPORT: {name} met the crowd and signed {signatures} autographs free of charge.'},
        {profile:'media',text:'{name} stayed for the fans today, finishing a free signing with {signatures} autographs.'},
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'fan',text:'{name} signed for free and stayed until the line was done. That is how you build real followers.'}
      ],
      autographStandard: [
        {profile:'media',text:'{name} met supporters and completed {signatures} autographs at today\'s signing.'},
        {profile:'media',text:'APPEARANCE REPORT: {signatures} fans left with an autograph from {name}.'},
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'fan',text:'Met {name} today. Worth the wait and actually talked to the fans.'}
      ],
      autographExpensive: [
        {profile:'media',text:'The premium ${price} signing from {name} drew {signatures} autograph buyers today.'},
        {profile:'media',text:'BUSINESS OUTSIDE THE CAGE: {name} completed {signatures} autographs at ${price} each.'},
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'hater',text:'Charging ${price} for an autograph? {name} is speed-running the unfollow button.'}
      ],
      sponsor: [
        {profile:'media',text:'SIGNED: {name} welcomes {brand} as the latest sponsor backing the climb.'},
        {profile:'media',text:'{brand} has struck a new sponsorship deal with rising fighter {name}.'},
        {profile:'media',text:'PARTNERSHIP NEWS: {name} and {brand} make their fight sponsorship official.'},
        {profile:'media',text:'{brand} signs {name} to a new fight contract.'},
        {profile:'fan',text:'From unknown rookie to sponsored fighter. {name} is building something.'},
        {profile:'hater',text:'A sponsor check does not improve your takedown defense, {name}.'}
      ]
    },
    interactions: {
      callout: {
        label:'CALL THEM OUT',
        messages:[
          '@{handle}, keep winning. I want your name across from mine when the matchmakers are ready.',
          '@{handle}, the record looks good. Let us see what happens when the cage door closes.',
          '@{handle}, no disrespect—but I see a fight the crowd would remember.',
          'Matchmakers, put @{handle} across from me. I will handle the rest.',
          '@{handle}, you have my attention. Now earn the contract with my name on it.',
          '@{handle}, your style against mine would sell every seat in the building.',
          'I respect the climb, @{handle}, but I would still take that matchup tomorrow.',
          '@{handle}, tell your team to keep the phone close. My side is interested.',
          'The division keeps talking about @{handle}. I would rather settle it in the cage.',
          '@{handle}, you bring the record. I will bring the pressure. Let us make it official.'
        ]
      },
      props: {
        label:'GIVE THEM PROPS',
        messages:[
          'Real recognizes real. @{handle} has been putting in serious work.',
          'Respect to @{handle}. That record was not built by taking easy nights.',
          '@{handle} keeps showing up prepared. The sport needs more of that.',
          'Credit where it is due: @{handle} is building a run worth watching.',
          'Strong work from @{handle}. Nothing fake about that climb.',
          '@{targetName} keeps answering every question the cage asks. Respect.',
          'That last performance put @{handle} on my radar for all the right reasons.',
          'No shortcuts in this game. @{handle} clearly understands that.',
          'The tape does not lie—@{handle} has been getting better every fight.',
          'Flowers while they can hear them: @{handle} is doing serious work.'
        ]
      },
      welcome: {
        label:'WELCOME THEM',
        messages:[
          'Welcome to the Cage Grind feed, @{handle}. The whole roster is watching now.',
          '@{handle} just joined the conversation. Welcome to the noise.',
          'Good to see @{handle} on the feed. Now give everybody a fight to talk about.',
          'Welcome, @{handle}. Keep the posts honest and the fights violent.',
          'Another real fighter enters the timeline. Welcome, @{handle}.',
          'Welcome aboard, @{handle}. The feed just got a little more dangerous.',
          '@{targetName} is here. Somebody warn the matchmakers the timeline has teeth now.',
          'Glad to see @{handle} join us. The grind is better with real fighters in it.',
          'New name on the feed, proven name in the cage. Welcome, @{handle}.',
          'Welcome to Cage Grind, @{handle}. Talk your talk and back it up under the lights.'
        ]
      },
      respect: {
        label:'SHOW RESPECT',
        messages:[
          '@{handle}, respect from one fighter to another. Keep climbing.',
          'Different gyms, same hard road. Respect to @{handle}.',
          'You can want the same belt and still respect the work. Salute, @{handle}.',
          '@{handle} understands what this life costs. Nothing but respect.',
          'No callout today—just respect for the work @{handle} is doing.',
          'We may cross paths someday, @{handle}. Until then, respect for the climb.',
          'Records get attention. Consistency earns respect. @{handle} has both.',
          'Every fighter knows the hours nobody sees. Salute to @{handle} for putting them in.',
          '@{targetName}, keep representing your city and your gym the right way.',
          'There is room for rivalry and respect. @{handle} has earned the second one today.'
        ]
      },
      watching: {
        label:'PUT THEM ON NOTICE',
        messages:[
          'I have been watching @{handle}. There are openings in that game.',
          '@{handle} is climbing fast. Good—the division needs pressure.',
          'Keep an eye on @{handle}. That name is going to matter soon.',
          '@{handle}, I see the momentum. I am watching where it goes.',
          'The roster is getting interesting. @{handle} might be part of the reason.',
          '@{handle} is collecting wins. I am collecting notes.',
          'The rankings move differently when @{targetName} starts making noise.',
          'I watched the tape on @{handle}. Talented, dangerous, and definitely beatable.',
          '@{handle}, enjoy the momentum. Every contender has somebody studying them.',
          'The division noticed @{handle}. Now let us see how they handle the spotlight.'
        ]
      }
    }
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
      pressure: {
        advice:"They're walking you down and building volume. Make them reset before they can swarm.",
        plan:'counter',action:'CIRCLE OFF THE FENCE',
        description:'Draw the rush, change the angle, and punish the opening.'
      },
      counter: {
        advice:"They're waiting for you to overreach. Give them feints, not easy counters.",
        plan:'control',action:'STOP CHASING',
        description:'Crowd their timing and make them work before they can set a trap.'
      },
      brawler: {
        advice:"They're loading up for one big shot. Stay composed and make every swing cost them.",
        plan:'control',action:'STAY OUT OF THE POCKET',
        description:'Smother the power, control the position, and deny the wild exchange.'
      },
      trickster: {
        advice:"They're breaking rhythm with feints and odd angles. Keep the picture simple and own the center.",
        plan:'control',action:'CONTROL THE DISTANCE',
        description:'Cut off the exits and force them into a predictable exchange.'
      },
      control: {
        advice:"They're driving every exchange toward the fence. Win the first grip and get your back off the cage.",
        plan:'submission',action:'DEFEND THE TAKEDOWN',
        description:'Stay dangerous in the scramble and attack every exposed neck or limb.'
      },
      submission: {
        advice:"They're hunting your neck whenever the distance closes. Protect the entry and make them pay for reaching.",
        plan:'pressure',action:'PROTECT YOUR NECK',
        description:'Keep them backing up so they cannot settle into submission attacks.'
      },
      wrestleBox: {
        advice:"They're mixing hands with level changes. Make them commit to one phase before you answer.",
        plan:'submission',action:'MAKE THEM COMMIT',
        description:'Read the transition and attack when they switch between striking and wrestling.'
      }
    }
  },

  ticker: [
    'Listen, kid: round costs climb with your career. Keep enough ready for all three.',
    'Want a miracle in the last ten seconds? Keep 5 extra energy for the haymaker, kid.',
    'Ice bath, sauna, or massage—one treatment a day. Recovery costs cash because comfort is for contenders.',
    'Commission wants 20 health before a bout. Heal up before they notice the bruises.',
    'Fresh contenders pay full purse. Old names pay half, so make the nostalgia quick.',
    'You beat a man once, he gets selective. Taunt a past rival if you want another envelope.',
    'First round, choose your hustle: attack for initiative or feel him out for the deeper read.',
    'By round two we know his tendency. Trust your own style unless you fancy losing at his game.',
    'No shop, no refunds. You want gear, you win fights and hope the drop lands in your locker.',
    'Fourth win without a gear drop? Even my supplier has to put something in the bag.',
    'Duplicate gear looks impressive, kid, but the perk still only counts once.',
    'One Daily Drop, every day. Free cash, free energy, collectible included. Do not ask who paid.',
    'Coach Vega wants $35 plus $20 per level. Talent is temporary; invoices are forever.',
    'Before Level 5, side gigs keep the lights on. After that, you are a full-time fighter—act like one.',
    'Followers open doors and hype makes noise. Publicity gets both, assuming you can still smile.',
    'CAGEGRINDCEO: Records get attention. Finishes get phone calls.',
    'A title only unlocks the champion. Nobody mails you a belt—you take it from the man holding it.',
    'CAGEGRINDCEO: Win when the lights are brightest and I will know your name.',
    'If the corner offers a towel or a haymaker, the safe money is gone. Pick the ending you can live with.'
  ]
};

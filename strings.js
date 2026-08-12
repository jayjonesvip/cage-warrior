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
    interruptions: [
      {id:'mom-text',kicker:'TEXT FROM MOM',title:'MOM TEXTED YOU',prompt:'The message arrived just before your gloves went on.',engage:'READ IT',ignore:'LEAVE IT UNREAD',outcomes:[{chance:.55,focus:100,text:'“We are proud of you. Go show them who you are.” Everything else falls away.'},{focus:50,text:'“Dad fell and broke his shoulder. Come after the fight.” The room suddenly feels very far away.'}],ignoreResult:{delta:-5,text:'You turn the phone over, but keep wondering why she texted tonight.'}},
      {id:'girlfriend-voicemail',kicker:'MISSED VOICEMAIL',title:'SHE LEFT A MESSAGE',prompt:'Your girlfriend called twice and left a voicemail.',engage:'LISTEN NOW',ignore:'SILENCE THE PHONE',outcomes:[{chance:.60,delta:12,text:'“Go handle business. I love you.” Her voice settles the entire room.'},{delta:-22,text:'She says you need to have a serious conversation when you get home.'}],ignoreResult:{delta:-6,text:'The red notification stays in the back of your mind.'}},
      {id:'kid-autograph',kicker:'KNOCK AT THE DOOR',title:'A KID WANTS YOUR AUTOGRAPH',prompt:'Security says a young fan is waiting outside in your shirt.',engage:'SIGN IT',ignore:'STAY IN THE ROOM',outcomes:[{chance:.70,delta:10,text:'The kid calls you their hero. You remember exactly why you fight.'},{delta:-8,text:'Security loses track of time and your warmup gets cut short.'}],ignoreResult:{delta:-4,text:'You hear the kid being led away and try not to picture their face.'}},
      {id:'coach-news',kicker:'COACH LOOKS UNEASY',title:'COACH HAS BAD NEWS',prompt:'Your coach asks whether you really want to hear it before the walkout.',engage:'TELL ME',ignore:'AFTER THE FIGHT',outcomes:[{chance:.50,delta:8,text:'The opponent looked compromised during inspection. Your target becomes clear.'},{delta:-18,text:'Your best training partner was taken to the hospital after a crash.'}],ignoreResult:{delta:-3,text:'You choose the fight, but his expression follows you.'}},
      {id:'opponent-trash-talk',kicker:'HALLWAY COLLISION',title:'THE OPPONENT WALKS PAST',prompt:'They stop at your door and make the insult personal.',engage:'ANSWER THEM',ignore:'LOOK THROUGH THEM',outcomes:[{chance:.55,delta:7,text:'They break eye contact first. The cage already feels like yours.'},{delta:-10,text:'The words land closer to home than you want to admit.'}],ignoreResult:{delta:3,text:'You refuse the bait. Discipline wins the first exchange.'}},
      {id:'unknown-call',kicker:'UNKNOWN NUMBER',title:'YOUR PHONE IS RINGING',prompt:'The same unknown number has called three times.',engage:'ANSWER IT',ignore:'DECLINE',outcomes:[{chance:.45,delta:14,text:'A former coach gives you one perfect reminder: “First move, no hesitation.”'},{delta:-12,text:'A collector demands an answer about a debt you forgot was due.'}],ignoreResult:{delta:-4,text:'The calls stop, but the reason remains unanswered.'}},
      {id:'sponsor-video',kicker:'SPONSOR REQUEST',title:'THEY NEED A VIDEO NOW',prompt:'Your sponsor wants a ten-second clip before you walk.',engage:'RECORD IT',ignore:'NOT TONIGHT',outcomes:[{chance:.65,delta:6,text:'One take. The room erupts when you nail the final line.'},{delta:-9,text:'Six takes later, nobody can remember what sounded natural.'}],ignoreResult:{delta:2,text:'The phone goes away. Tonight is about the fight.'}},
      {id:'partner-warning',kicker:'LAST-SECOND READ',title:'A TRAINING PARTNER HAS A WARNING',prompt:'They noticed something during the opponent’s warmup.',engage:'HEAR THEM OUT',ignore:'TRUST THE CAMP',outcomes:[{chance:.60,delta:9,text:'The observation fits the game plan perfectly. You know where the opening is.'},{delta:-11,text:'Their warning contradicts everything the camp prepared.'}],ignoreResult:{delta:2,text:'You trust the work already done and keep the plan simple.'}},
      {id:'old-loss',kicker:'ARENA MONITOR',title:'YOUR OLD LOSS IS PLAYING',prompt:'The broadcast is replaying the finish that still bothers you.',engage:'WATCH IT',ignore:'TURN IT OFF',outcomes:[{chance:.50,delta:12,text:'For the first time, you see the exact mistake. It will not happen again.'},{delta:-14,text:'The memory feels current again—the lights, the noise, the count.'}],ignoreResult:{delta:3,text:'The screen goes dark. That version of you is not fighting tonight.'}},
      {id:'family-chat',kicker:'PHONE BUZZING',title:'THE FAMILY CHAT EXPLODES',prompt:'Thirty-two unread messages appear in less than a minute.',engage:'CHECK THE CHAT',ignore:'MUTE IT',outcomes:[{chance:.65,delta:8,text:'Everyone is sending photos from a loud family watch party.'},{delta:-15,text:'A family argument has swallowed the chat, and now they want you to choose a side.'}],ignoreResult:{delta:-3,text:'You mute the noise, though a piece of it stays with you.'}},
      {id:'old-friend',kicker:'VISITOR OUTSIDE',title:'AN OLD FRIEND SHOWED UP',prompt:'Someone from before the career is asking for one minute.',engage:'LET THEM IN',ignore:'SEND THEM HOME',outcomes:[{chance:.60,delta:11,text:'They remind you how impossible this once seemed. You feel ten feet tall.'},{delta:-13,text:'They need money and say you are the only person who can help.'}],ignoreResult:{delta:-4,text:'You protect the routine, but wonder what brought them here.'}},
      {id:'injury-rumor',kicker:'LOCKER-ROOM RUMOR',title:'THE OPPONENT MAY BE HURT',prompt:'A familiar face claims the opponent injured a rib in camp.',engage:'CHANGE THE PLAN',ignore:'TRUST YOUR PREP',outcomes:[{chance:.50,delta:10,text:'The source is solid. You know exactly where to apply pressure.'},{delta:-9,text:'Your coach calls it nonsense, and now two game plans are competing in your head.'}],ignoreResult:{delta:2,text:'Rumors do not get a vote. You stay with the work.'}},
      {id:'bank-alert',kicker:'URGENT ALERT',title:'YOUR BANK NEEDS ATTENTION',prompt:'A red notification says an important transaction failed.',engage:'OPEN THE ALERT',ignore:'HANDLE IT LATER',outcomes:[{chance:.55,delta:5,text:'It is a harmless security check. Relief hits like a clean breath.'},{delta:-16,text:'A major payment bounced. The problem will still be waiting after the bell.'}],ignoreResult:{delta:-7,text:'You pocket the phone, but your mind starts counting money.'}},
      {id:'brother-video',kicker:'VIDEO FROM YOUR BROTHER',title:'HE SAYS YOU HAVE TO SEE THIS',prompt:'The preview shows your whole family crowded around a television.',engage:'PLAY THE VIDEO',ignore:'SAVE IT FOR LATER',outcomes:[{chance:.65,delta:10,text:'The room chants your name. You carry all of them toward the cage.'},{delta:-9,text:'The camera catches your father looking more worried than proud.'}],ignoreResult:{delta:-3,text:'You save it, then keep imagining what everyone wanted to say.'}},
      {id:'walkout-song',kicker:'PRODUCTION PROBLEM',title:'YOUR WALKOUT SONG WILL NOT PLAY',prompt:'The arena needs an answer: choose a backup or walk out in silence.',engage:'PICK A BACKUP',ignore:'WALK IN SILENCE',outcomes:[{chance:.50,delta:8,text:'The backup track hits harder than the original ever did.'},{delta:-6,text:'Every option sounds wrong. The ritual feels incomplete.'}],ignoreResult:{delta:4,text:'No music. No distraction. Just your footsteps toward the cage.'}}
    ]
  },

  social: {
    profiles: {
      media: {author:'CageReporter',handle:'@CageReporter',tone:'media'},
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
    cycles: {
      fightWin: [
        {profile:'media',text:'RESULT: {name} gets past {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'{name} leaves the cage with the win after defeating {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'OFFICIAL: {name} adds another victory over {opponent} by {finish}.{titleSuffix}'},
        {profile:'media',text:'{name} defeats {opponent} by {finish}.{titleSuffix}'},
        {profile:'rival',author:'{opponent}',text:'Enjoy the win, {name}. If they book it again, I know what changes.'},
        {profile:'fan',text:'That was the kind of performance that turns a prospect into must-watch television. {name} showed up.'}
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
    'Need trainer money? Hustle. Side gigs pay cash, even when nobody calls it career earnings.',
    'Followers open doors and hype makes noise. Publicity gets both, assuming you can still smile.',
    'A title only unlocks the champion. Nobody mails you a belt—you take it from the man holding it.',
    'If the corner offers a towel or a haymaker, the safe money is gone. Pick the ending you can live with.'
  ]
};

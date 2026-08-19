globalThis.CAGE_STRINGS = {
  fighterIdentity: {
    colors: ['White','Golden','Blue','Red','Black','Silver','Green','Orange','Purple','Crimson','Scarlet','Gray','Bronze','Copper','Indigo','Violet','Azure','Emerald','Dark','Light','Iron','Rogue','Wild','Prime','Lucky','Heavy','Silent','Midnight','Cold','Savage','Wicked','True','Rapid','Mad','Electric','Thunder','Neon','Steel','Shadow','Storm','Venom','Outlaw','Gritty','Relentless','Blazing','Phantom','Cosmic','Fearless','Turbo','Brutal','Atomic','Rebel'],
    origins: ['American','Mexican','Russian','Brazilian','Canadian','Irish','British','Scottish','French','German','Italian','Spanish','Portuguese','Japanese','Korean','Chinese','Thai','Filipino','Nigerian','Cuban','Jamaican','Australian','Dutch','Polish'],
    weather: ['Drizzle','Wind','Pressure','Tornado','Storm','Thunder','Lightning','Blizzard','Cyclone','Hurricane','Tempest','Monsoon','Wildfire','Avalanche','Typhoon','Hail','Frost','Downpour','Heatwave','Duststorm','Cloudburst','Whirlwind','Firestorm'],
    animals: ['Viper','Cobra','Mamba','Python','Tiger','Lion','Panther','Jaguar','Leopard','Wolf','Bear','Shark','Orca','Hawk','Falcon','Eagle','Raven','Scorpion','Rhino','Bull','Boar','Crocodile','Alligator','Wolverine','Barracuda','Piranha','Dog','Cat','Raptor','Mastodon','Jackal','Coyote','Raccoon','Dragon','Goat'],
    combat: ['Hammer','Bomber','Fist','Claw','Crusher','Puncher','Slugger','Bruiser','Haymaker','Knuckle','Mauler','Wrecker','Grinder','Striker','Kicker','Choker','Grappler','Hunter','Warrior','Gladiator','Cannon','Blade','Anvil','Breaker','Monster','Demon','Devil','Destroyer'],
    cityCodes: {
      phoenix:'PHX','los-angeles':'LAX',chicago:'CHI','new-york':'NYC',miami:'MIA',houston:'HOU',cleveland:'CLE',seattle:'SEA','new-orleans':'NOLA',hawaii:'HNL',boston:'BOS',atlanta:'ATL','san-francisco':'SFO',denver:'DEN','tampa-bay':'TPA',philadelphia:'PHL','san-antonio':'SAT','las-vegas':'LAS',portland:'PDX',baltimore:'BWI'
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

  fightFocus: {contacts: globalThis.CAGE_FIGHT_FOCUS_CONTACTS||[]},

  social: {
    profiles: {
      media: {author:'CageReporter',handle:'@CageReporter',tone:'media',avatar:'assets/cage-reporter.jpg?v=2.5.172',verified:true,bio:'Cage Grind’s official fight desk. Publishes one official result report after each eligible fight.'},
      ceo: {author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo',avatar:'assets/cage-grind-ceo.jpg?v=2.5.172',verified:true,bio:'Founder and CEO of Cage Grind. Builds the cards, signs the title fights, and decides which performances deserve the biggest stage.'},
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
    sponsorSigning:'Welcome @{name} to the {brand} team. We are proud to back the next stage of the climb.',
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
    'Listen, kid: round costs climb with your career. Keep enough ready for all three.',
    'Fast pace is an investment, kid. Bring better cardio than the other guy or pay interest late.',
    'Ice bath, sauna, or massage—one treatment a day. Recovery costs cash because comfort is for contenders.',
    'Commission wants 20 health before a bout. Heal up before they notice the bruises.',
    'Fresh contenders pay full purse. Old names pay half, so make the nostalgia quick.',
    'You beat a man once, he gets selective. Taunt a past rival if you want another envelope.',
    'Set the plan before the walkout: pace, offense, and whether you trust your style or adapt.',
    'Adapting takes focus, kid. Round one reads him, round two adjusts, round three owns the answer.',
    'No shop, no refunds. You want gear, you win fights and hope the drop lands in your locker.',
    'Fourth win without a CEO gift? Keep winning. The boss eventually notices everybody.',
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

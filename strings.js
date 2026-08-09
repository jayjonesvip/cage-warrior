globalThis.CAGE_STRINGS = {
  opponentNames: {
    first: ['AARON','ACE','ADAM','ALEKSEI','ANDRE','ANTON','AXEL','BOONE','BRYCE','CALEB','CARLOS','CHRIS','CRUZ','DAMON','DANTE','DARIUS','DIEGO','DMITRI','DOM','ELI','ENZO','ERIK','FINN','GABE','HECTOR','ISAAC','IVAN','JACE','JAMAL','JAVIER','JONAH','JULIAN','KAI','LEO','MALIK','MARCUS','MATEO','MIKHAIL','NICO','NIKOLAI','OMAR','PAVEL','RAFA','ROMAN','RYAN','SERGEI','SILAS','TATE','TOMAS','TY','VANCE','VIKTOR','YURI','ZANE'],
    last: ['ANDERSON','BISHOP','BLACK','BLAZE','BROWN','CARTER','CASTILLO','COLE','CROW','DAVIS','DIAZ','DRAKE','FEDOROV','FROST','GARCIA','GONZALEZ','GRAVES','HALE','HAYES','HERNANDEZ','IVANOV','JACKSON','JOHNSON','JONES','KARPOV','KNOX','KOZLOV','KUZNETSOV','LEBEDEV','MARTINEZ','MERCER','MILLER','MOROZOV','NASH','ORLOV','PETROV','PIKE','POPOV','QUINN','REYES','RODRIGUEZ','ROOK','SANTOS','SHAW','SMIRNOV','SMITH','SOKOLOV','STEEL','STONE','THOMPSON','VALE','VOLKOV','WARD','WILLIAMS','WOLFE','YOUNG','ZAITSEV']
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
        {profile:'media',text:'{name} defeats {opponent} by {finish}.{titleSuffix}'},
        {profile:'rival',author:'{opponent}',text:'Enjoy the win, {name}. If they book it again, I know what changes.'},
        {profile:'fan',text:'That was the kind of performance that turns a prospect into must-watch television. {name} showed up.'}
      ],
      fightWinHater: {profile:'hater',text:'Everybody relax. One win does not make {name} unbeatable. Book the rematch.'},
      fightStreakHeadline: {profile:'media',text:'WIN STREAK: {name} has now won {winStreak} straight fights. The division has to pay attention.'},
      fightStreakHater: {profile:'hater',text:'{winStreak} straight? Wake me up when {name} beats someone I picked.'},
      fightLoss: [
        {profile:'media',text:'{opponent} hands {name} a loss by {finish}. The comeback starts with the response.'},
        {profile:'rival',author:'{opponent}',text:'Respect for taking the fight, {name}. But tonight belonged to me.'},
        {profile:'hater',text:'The hype train needed brakes. {name} just found them.'},
        {profile:'fan',text:'Losses happen. Still here, still following, and waiting for the comeback.'}
      ],
      appearance: [
        {profile:'media',text:'{name} made an appearance on {title}. The fight world is starting to notice.'},
        {profile:'fan',text:'Saw {name} making the rounds today. Good energy and no fake superstar routine.'},
        {profile:'hater',text:'Another appearance? I would rather see {name} book a fight.'}
      ],
      viralAppearance: [
        {profile:'media',text:'{name} made an appearance on {title}. The fight world is starting to notice.'},
        {profile:'fan',text:'That {name} clip is everywhere. The timeline belongs to a cage fighter today.'},
        {profile:'hater',text:'Another appearance? I would rather see {name} book a fight.'}
      ],
      autographFree: [
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'fan',text:'{name} signed for free and stayed until the line was done. That is how you build real followers.'}
      ],
      autographStandard: [
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'fan',text:'Met {name} today. Worth the wait and actually talked to the fans.'}
      ],
      autographExpensive: [
        {profile:'media',text:'{name} signed {signatures} autographs at today’s appearance.'},
        {profile:'hater',text:'Charging ${price} for an autograph? {name} is speed-running the unfollow button.'}
      ],
      sponsor: [
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
          '@{handle}, you have my attention. Now earn the contract with my name on it.'
        ]
      },
      props: {
        label:'GIVE THEM PROPS',
        messages:[
          'Real recognizes real. @{handle} has been putting in serious work.',
          'Respect to @{handle}. That record was not built by taking easy nights.',
          '@{handle} keeps showing up prepared. The sport needs more of that.',
          'Credit where it is due: @{handle} is building a run worth watching.',
          'Strong work from @{handle}. Nothing fake about that climb.'
        ]
      },
      welcome: {
        label:'WELCOME THEM',
        messages:[
          'Welcome to the Cage Grind feed, @{handle}. The whole roster is watching now.',
          '@{handle} just joined the conversation. Welcome to the noise.',
          'Good to see @{handle} on the feed. Now give everybody a fight to talk about.',
          'Welcome, @{handle}. Keep the posts honest and the fights violent.',
          'Another real fighter enters the timeline. Welcome, @{handle}.'
        ]
      },
      respect: {
        label:'SHOW RESPECT',
        messages:[
          '@{handle}, respect from one fighter to another. Keep climbing.',
          'Different gyms, same hard road. Respect to @{handle}.',
          'You can want the same belt and still respect the work. Salute, @{handle}.',
          '@{handle} understands what this life costs. Nothing but respect.',
          'No callout today—just respect for the work @{handle} is doing.'
        ]
      },
      watching: {
        label:'PUT THEM ON NOTICE',
        messages:[
          'I have been watching @{handle}. There are openings in that game.',
          '@{handle} is climbing fast. Good—the division needs pressure.',
          'Keep an eye on @{handle}. That name is going to matter soon.',
          '@{handle}, I see the momentum. I am watching where it goes.',
          'The roster is getting interesting. @{handle} might be part of the reason.'
        ]
      }
    }
  },

  ticker: [
    'Listen, kid: keep 30 energy ready. The cage takes 10 every round it needs.',
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

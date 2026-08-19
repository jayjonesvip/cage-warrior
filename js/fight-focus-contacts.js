(function(root){
  'use strict';
  root.CAGE_FIGHT_FOCUS_CONTACTS=[
      {id:'mom',name:'MOM',avatar:'assets/contact-mom.jpg?v=2.5.164',ignoreDelta:-4,ignoreText:'You leave Mom’s message unread, but keep wondering why she texted tonight.',messages:[
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
      {id:'wife',name:'WIFE',avatar:'assets/contact-wife.jpg?v=2.5.164',ignoreDelta:-5,ignoreText:'You leave your wife’s message unread, and the notification follows you toward the cage.',messages:[
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
      {id:'brother-tommy',name:'BROTHER TOMMY',avatar:'assets/contact-brother-tommy.png?v=2.5.164',ignoreDelta:-3,ignoreText:'You leave Tommy’s message unread. With him, that could mean anything.',messages:[
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
      {id:'agent-carl',name:'AGENT CARL',avatar:'assets/contact-agent-carl.png?v=2.5.164',ignoreDelta:-2,ignoreText:'You leave Carl on unread, but wonder what deal—or problem—he is sitting on.',messages:[
        {id:'carl-sponsor',text:'Big sponsor in the front row. Put on a show and I can make the phone ring tomorrow.',delta:9},
        {id:'carl-purse',text:'I squeezed another bonus into the deal. Win tonight and the number gets very interesting.',delta:7},
        {id:'carl-fees',text:'Small paperwork issue: my expenses come out before your purse. We’ll discuss the total later.',delta:-12},
        {id:'carl-bad-deal',text:'I may have promised them an immediate rematch if you lose. Do me a favor and don’t lose.',delta:-9}
      ]},
      {id:'grandma',name:'GRANDMA',avatar:'assets/contact-grandma.jpg?v=2.5.164',ignoreDelta:-2,ignoreText:'You leave Grandma on unread. She will tell Grandpa you are too busy for family.',messages:[
        {id:'grandma-tv-remote',text:'Grandpa saw you on TV. We can’t find the remote, so your fight is staying on. He says knock ’em silly.',delta:8},
        {id:'grandma-bingo',text:'I told everyone at bingo my grandbaby is a fighter. Now go make me look honest.',delta:10},
        {id:'grandma-bigger',text:'Grandpa says the other fighter looks bigger. I told him not to call you before the fight, so I’m texting instead.',delta:-7},
        {id:'grandma-smoke-alarm',text:'Can you come over after the fight? The smoke alarm has been chirping since Tuesday and Grandpa keeps saluting it.',delta:-9}
      ]}
    ];
})(globalThis);


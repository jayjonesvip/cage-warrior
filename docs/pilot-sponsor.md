# Pilot progression sponsor

The slot ships empty. No branding, links, progression, rewards, or collectible sponsors change while CONFIG is null in js/pilot-sponsor.js.

To activate a pilot, replace CONFIG with an object like this (example only):

```js
const CONFIG={
  replaces:'ironhide',
  brand:'Example Fightwear',
  handle:'@ExampleFightwear',
  product:'MMA T-shirts and fight apparel',
  logoAsset:'assets/partners/example-fightwear.png',
  bio:'Independent fight apparel. Proud to back the next generation of fighters.',
  website:'https://example.com/'
};
```

- Upload the approved logo at the specified local asset path before deploying. Brand, valid local logo path, and an existing slot ID are required; incomplete configurations do nothing.
- The website is optional. Only HTTPS links without embedded credentials are displayed; missing/invalid links produce no CTA.
- Existing slots: bobs-auto, garys-bar-grill, volt, ironhide, apex-wireless, northline-auto, titan-global.
- The selected slot retains its ID and follower requirement. Current holders see the pilot branding too. No bonuses, currencies, or collectible definitions change.
- The logo appears on the Home sponsor badge/backdrop, sponsor announcement, and Cage Feed sponsor profile.
- The sponsor profile labels the placement as a pilot and offers a website link when supplied.
- Optionally provide exactly five messages in a messages array, with {name} and {moment} placeholders. Otherwise neutral brand-safe highlight copy is used.
- Feed sponsor identities follow the current slot branding. Older sponsor posts in that slot are rebranded on display; stored server posts are not rewritten. Existing fictional brand mentions in those sponsor posts are replaced with the current brand name.
- End the pilot by restoring CONFIG=null and deploying a new cache-busted app version. The fictional sponsor returns, with no player migration required.
- No SQL migration is needed: the existing progression sponsor ID is retained.
- The game does not verify asset existence at configuration parsing time. Confirm the uploaded logo renders in a browser before activating a partner.

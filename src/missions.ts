export type Language = 'sv' | 'en';
export type Category = 'forest' | 'sea' | 'city' | 'legendary';
export type LocalText = Record<Language, string>;

type Mission = {
  id: number;
  category: Category;
  xp: number;
  title: LocalText;
  description: LocalText;
};

const rows: [Category, number, string, string, string, string][] = [
  ['forest', 100, 'The Giant Leaf', 'Jättelövet', 'Find a fallen leaf that is bigger than your own hand.', 'Hitta ett löv på marken som är större än din egen hand.'],
  ['forest', 200, 'Bug Hotel', 'Insektshotellet', 'Build a tiny house out of sticks, moss, and bark for a forest bug.', 'Bygg ett litet hus av pinnar, mossa och bark åt en insekt i skogen.'],
  ['forest', 100, 'Tree Hugger', 'Trädkramaren', 'Find the thickest tree in the park and give it a big hug.', 'Hitta parkens tjockaste träd och ge det en stor kram.'],
  ['forest', 200, 'Animal Spotter', 'Djurspanaren', 'Spot a real animal in Slottsskogen (like a seal, penguin, moose, or duck) and mimic its sound.', 'Spana efter ett djur i Slottsskogen (till exempel en säl, pingvin, älg eller anka) och härma hur det låter.'],
  ['forest', 150, 'Pinecone Bowling', 'Kottbowling', 'Collect 5 pinecones and try to knock over a standing stick from 3 steps away.', 'Samla 5 kottar och försök välta en stående pinne från 3 stegs avstånd.'],
  ['forest', 100, 'Soft & Hard', 'Mjukt och hårt', 'Touch something very soft (like green moss) and something very hard (like a granite rock).', 'Känn på något riktigt mjukt (som grön mossa) och något riktigt hårt (som en granitsten).'],
  ['forest', 150, 'Forest Balance Beam', 'Skogens balansbom', 'Walk across a fallen tree log from one end to the other while holding hands.', 'Gå från ena änden till den andra på en fallen trädstam medan ni håller varandra i handen.'],
  ['sea', 150, 'Stone Tower', 'Stentornet', 'Stack 4 flat stones on top of each other near the water without them falling.', 'Stapla 4 platta stenar vid vattnet utan att tornet rasar.'],
  ['sea', 100, 'Blue & Yellow Boat', 'Blå och gul båt', 'Spot a boat or a ferry (like Älvsnabben) on the water and wave to the captain.', 'Spana efter en båt eller färja (som Älvsnabben) och vinka till kaptenen.'],
  ['sea', 200, 'Shell & Crab Hunt', 'Snäck- och krabbjakt', 'Find an empty seashell or peek into shallow water to spot a tiny crab.', 'Hitta ett tomt snäckskal eller kika ner i grunt vatten efter en liten krabba.'],
  ['sea', 100, 'Roundest Pebble', 'Rundaste stenen', 'Search the shore to find the smoothest, roundest stone.', 'Leta längs stranden efter den slätaste och rundaste stenen.'],
  ['sea', 100, 'Water Splash', 'Vattenplask', 'Throw a stone into the sea or a lake and watch the ripples grow.', 'Kasta en sten i havet eller en sjö och se ringarna på vattnet växa.'],
  ['sea', 100, 'Wind Listener', 'Lyssna på vinden', 'Close your eyes near the water for 10 seconds and listen to the wind and seagulls.', 'Blunda nära vattnet i 10 sekunder och lyssna på vinden och måsarna.'],
  ['city', 100, 'Blue Tram Wave', 'Vinka till spårvagnen', 'Spot a blue Gothenburg tram (Spårvagn) and wave at the driver.', 'Spana efter en blå spårvagn i Göteborg och vinka till föraren.'],
  ['city', 150, 'Puddle Jumper', 'Pölhopparen', 'Find a rainwater puddle and jump over it—or splash right in the middle with boots!', 'Hitta en vattenpöl och hoppa över den – eller plaska mitt i pölen med stövlar!'],
  ['city', 100, 'Color Hunt: Yellow', 'Färgjakt: gult', 'Find 3 different yellow things during your walk (a flower, a sign, a house, or a car).', 'Hitta 3 olika gula saker under promenaden (en blomma, en skylt, ett hus eller en bil).'],
  ['city', 150, 'Shadow Monster', 'Skuggmonstret', 'Make a funny giant shadow shape together on the pavement or a wall.', 'Gör en rolig jätteskugga tillsammans på trottoaren eller en vägg.'],
  ['city', 200, 'Lion & Statue Search', 'Lejon- och statyjakt', 'Find a statue in the city (like a lion or a horse) and strike the exact same pose next to it.', 'Hitta en staty i stan (som ett lejon eller en häst) och ställ er bredvid i precis samma pose.'],
  ['city', 100, 'Cloud Shapes', 'Molnfigurer', 'Look up at the sky and find a cloud that looks like an animal or a vehicle.', 'Titta upp och hitta ett moln som liknar ett djur eller ett fordon.'],
  ['city', 100, 'Stick Music', 'Pinnmusik', 'Find two wooden sticks and tap out a rhythm together like forest drummers.', 'Hitta två pinnar och knacka en rytm tillsammans som skogens trumslagare.'],
  ['legendary', 200, 'Night Flashlight Walk', 'Ficklampspromenad', 'Take a short walk after dusk with flashlights and spot 3 glowing reflections.', 'Gå en kort promenad efter skymningen med ficklampor och hitta 3 lysande reflexer.'],
  ['legendary', 200, 'Archipelago Ferry Captain', 'Skärgårdskapten', 'Ride a ferry across Göta älv or to the Southern Archipelago and spot a lighthouse.', 'Ta en färja över Göta älv eller till södra skärgården och spana efter en fyr.'],
  ['legendary', 200, 'Stick Raft Builder', 'Bygg en pinnflotte', 'Build a small raft from sticks and bark and test if it floats.', 'Bygg en liten flotte av pinnar och bark och testa om den flyter.'],
  ['legendary', 200, 'Fika in the Wild', 'Fika i det fria', 'Have an outdoor picnic with warm drinks and buns on a rock or blanket.', 'Fika utomhus med varm dryck och bullar på en klippa eller filt.'],
  ['legendary', 200, 'Star & Moon Gazer', 'Stjärn- och månspanaren', 'Spot the moon or the first evening star before bedtime.', 'Spana efter månen eller kvällens första stjärna före läggdags.'],
];

export const missions: Mission[] = rows.map(([category, xp, enTitle, svTitle, enText, svText], index) => ({
  id: index + 1, category, xp,
  title: { en: enTitle, sv: svTitle },
  description: { en: enText, sv: svText },
}));

export const categories = {
  all: { en: 'All', sv: 'Alla' },
  forest: { en: 'Forest & Parks', sv: 'Skog och parker' },
  sea: { en: 'By the Sea', sv: 'Vid havet' },
  city: { en: 'Neighborhood', sv: 'I kvarteret' },
  legendary: { en: 'Legendary Quests', sv: 'Legendariska uppdrag' },
};

export const areas = {
  legendary: { en: 'Gothenburg & the West Coast', sv: 'Göteborg och Västkusten' },
  forest: { en: 'Slottsskogen · Delsjön · Botaniska · Änggårdsbergen', sv: 'Slottsskogen · Delsjön · Botaniska · Änggårdsbergen' },
  sea: { en: 'Archipelago · Långedrag · Röda Sten · Rivö fjord', sv: 'Skärgården · Långedrag · Röda Sten · Rivö fjord' },
  city: { en: 'Haga · Linné · Anywhere', sv: 'Haga · Linné · Var som helst' },
};

export const quickTags: Record<string, LocalText> = {
  slottsskogen: { en: 'Slottsskogen', sv: 'Slottsskogen' },
  delsjon: { en: 'Delsjön', sv: 'Delsjön' },
  haga: { en: 'Haga', sv: 'Haga' },
  archipelago: { en: 'Archipelago', sv: 'Skärgården' },
  park: { en: 'My Park', sv: 'Min park' },
};

export const avatars = {
  moose: { en: 'Moose', sv: 'Älg' },
  seal: { en: 'Seal', sv: 'Säl' },
  fox: { en: 'Fox', sv: 'Räv' },
  puffin: { en: 'Puffin', sv: 'Lunnefågel' },
};

export type Avatar = keyof typeof avatars;
export const levelFor = (xp: number) => Math.min(10, Math.floor(xp / 150));

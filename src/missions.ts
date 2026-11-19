export type Language = 'sv' | 'en';
export type Category = 'forest' | 'sea' | 'city';
export type LocalText = Record<Language, string>;

type Mission = {
  id: number;
  category: Category;
  xp: number;
  title: LocalText;
  description: LocalText;
};

const rows: [Category, number, string, string, string, string][] = [
  ['forest', 50, 'The Giant Leaf', 'Jättelövet', 'Find a fallen leaf that is bigger than your own hand.', 'Hitta ett löv på marken som är större än din egen hand.'],
  ['forest', 100, 'Bug Hotel', 'Insektshotellet', 'Build a tiny house out of sticks, moss, and bark for a forest bug.', 'Bygg ett litet hus av pinnar, mossa och bark åt en insekt i skogen.'],
  ['forest', 50, 'Tree Hugger', 'Trädkramaren', 'Find the thickest tree in the park and give it a big hug.', 'Hitta parkens tjockaste träd och ge det en stor kram.'],
  ['forest', 100, 'Animal Spotter', 'Djurspanaren', 'Spot a real animal in Slottsskogen (like a seal, penguin, moose, or duck) and mimic its sound.', 'Spana efter ett djur i Slottsskogen (till exempel en säl, pingvin, älg eller anka) och härma hur det låter.'],
  ['forest', 75, 'Pinecone Bowling', 'Kottbowling', 'Collect 5 pinecones and try to knock over a standing stick from 3 steps away.', 'Samla 5 kottar och försök välta en stående pinne från 3 stegs avstånd.'],
  ['forest', 50, 'Soft & Hard', 'Mjukt och hårt', 'Touch something very soft (like green moss) and something very hard (like a granite rock).', 'Känn på något riktigt mjukt (som grön mossa) och något riktigt hårt (som en granitsten).'],
  ['forest', 75, 'Forest Balance Beam', 'Skogens balansbom', 'Walk across a fallen tree log from one end to the other while holding hands.', 'Gå från ena änden till den andra på en fallen trädstam medan ni håller varandra i handen.'],
  ['sea', 75, 'Stone Tower', 'Stentornet', 'Stack 4 flat stones on top of each other near the water without them falling.', 'Stapla 4 platta stenar vid vattnet utan att tornet rasar.'],
  ['sea', 50, 'Blue & Yellow Boat', 'Blå och gul båt', 'Spot a boat or a ferry (like Älvsnabben) on the water and wave to the captain.', 'Spana efter en båt eller färja (som Älvsnabben) och vinka till kaptenen.'],
  ['sea', 100, 'Shell & Crab Hunt', 'Snäck- och krabbjakt', 'Find an empty seashell or peek into shallow water to spot a tiny crab.', 'Hitta ett tomt snäckskal eller kika ner i grunt vatten efter en liten krabba.'],
  ['sea', 50, 'Roundest Pebble', 'Rundaste stenen', 'Search the shore to find the smoothest, roundest stone.', 'Leta längs stranden efter den slätaste och rundaste stenen.'],
  ['sea', 50, 'Water Splash', 'Vattenplask', 'Throw a stone into the sea or a lake and watch the ripples grow.', 'Kasta en sten i havet eller en sjö och se ringarna på vattnet växa.'],
  ['sea', 50, 'Wind Listener', 'Lyssna på vinden', 'Close your eyes near the water for 10 seconds and listen to the wind and seagulls.', 'Blunda nära vattnet i 10 sekunder och lyssna på vinden och måsarna.'],
  ['city', 50, 'Blue Tram Wave', 'Vinka till spårvagnen', 'Spot a blue Gothenburg tram (Spårvagn) and wave at the driver.', 'Spana efter en blå spårvagn i Göteborg och vinka till föraren.'],
  ['city', 75, 'Puddle Jumper', 'Pölhopparen', 'Find a rainwater puddle and jump over it—or splash right in the middle with boots!', 'Hitta en vattenpöl och hoppa över den – eller plaska mitt i pölen med stövlar!'],
  ['city', 50, 'Color Hunt: Yellow', 'Färgjakt: gult', 'Find 3 different yellow things during your walk (a flower, a sign, a house, or a car).', 'Hitta 3 olika gula saker under promenaden (en blomma, en skylt, ett hus eller en bil).'],
  ['city', 75, 'Shadow Monster', 'Skuggmonstret', 'Make a funny giant shadow shape together on the pavement or a wall.', 'Gör en rolig jätteskugga tillsammans på trottoaren eller en vägg.'],
  ['city', 100, 'Lion & Statue Search', 'Lejon- och statyjakt', 'Find a statue in the city (like a lion or a horse) and strike the exact same pose next to it.', 'Hitta en staty i stan (som ett lejon eller en häst) och ställ er bredvid i precis samma pose.'],
  ['city', 50, 'Cloud Shapes', 'Molnfigurer', 'Look up at the sky and find a cloud that looks like an animal or a vehicle.', 'Titta upp och hitta ett moln som liknar ett djur eller ett fordon.'],
  ['city', 50, 'Stick Music', 'Pinnmusik', 'Find two wooden sticks and tap out a rhythm together like forest drummers.', 'Hitta två pinnar och knacka en rytm tillsammans som skogens trumslagare.'],
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
};

export const areas = {
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
export const levelFor = (xp: number) => Math.floor(xp / 300) + 1;

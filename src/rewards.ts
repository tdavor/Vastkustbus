export const milestones = [300, 600, 1000, 1500] as const;
export type Milestone = typeof milestones[number];
export type Accessory = 'binoculars' | 'backpack' | 'hat';
export type RewardText = 'fika' | 'ticket';

export type Rewards = {
  unlocked: Milestone[];
  accessories: Accessory[];
  captain: boolean;
  texts: Partial<Record<RewardText, string>>;
  favorite?: string;
};

export const initialRewards: Rewards = { unlocked: [], accessories: [], captain: false, texts: {} };
export const reachedMilestones = (xp: number) => milestones.filter(mark => xp >= mark);
export function currentRun<T>(memories: readonly T[], previousRunCount = 0) {
  return memories.slice(0, Math.max(0, memories.length - previousRunCount));
}
export const totalXP = (memories: readonly { xp: number }[]) => memories.reduce((total, memory) => total + memory.xp, 0);
export function missionXP(memories: readonly { missionId: number }[], missionId: number, base: number) {
  return memories.some(memory => memory.missionId === missionId) ? base / 2 : base;
}

export const rewardsCopy = {
  en: {
    chest: 'Treasure Chest', next: 'Next reward', all: 'All four treasures unlocked!',
    locked: 'Locked', unlocked: 'Unlocked!', equip: 'Wear', equipped: 'Wearing',
    titles: ['First Explorer Step', 'Fika Reward', 'Secret Map & Gear', 'Grand Captain Finale'],
    summaries: ['Binoculars and the Adventure Slideshow', 'Explorer Backpack and a Fika Treat Coupon', 'Legendary Quests and Real Explorer Gear', 'Golden Captain Seal, Captain’s Hat, diploma and Golden Ticket'],
    accessories: { binoculars: 'Binoculars', backpack: 'Explorer Backpack', hat: 'Captain’s Hat' },
    captain: 'Golden Captain Seal', slideshow: 'Play Adventure Slideshow', pause: 'Pause', play: 'Play', previous: 'Previous photo', nextPhoto: 'Next photo',
    edit: 'Hold for 3 seconds to edit', save: 'Save', fika: 'Fika Treat Coupon', ticket: 'Grand Golden Adventure Ticket',
    fikaDefault: 'Time for a cozy Fika! Kanelbulle, hot chocolate, or ice cream after our walk.',
    ticketDefault: 'Grand Choice: Ferry trip to Styrsö, Universeum visit, or Slottsskogen picnic!',
    gear: 'Real Explorer Gear', gearText: 'Choose a small explorer gift together, like a magnifying glass, flashlight, or kids’ compass.',
    diploma: 'MinneTrail Captain', print: 'Share or print diploma', favorite: 'Use this photo on my diploma',
    chosen: 'Diploma photo selected', count: 'Missions completed', celebrate: 'New treasure!',
    dismiss: 'Keep exploring', sharingError: 'Could not share the diploma.',
  },
  sv: {
    chest: 'Skattkista', next: 'Nästa belöning', all: 'Alla fyra skatter är upplåsta!',
    locked: 'Låst', unlocked: 'Upplåst!', equip: 'Ta på', equipped: 'På',
    titles: ['Första upptäckarsteget', 'Fikabelöning', 'Hemlig karta och utrustning', 'Stora kaptensfinalen'],
    summaries: ['Kikare och Äventyrsfilm', 'Upptäckarryggsäck och fikakupong', 'Legendariska uppdrag och riktig upptäckarutrustning', 'Gyllene kaptenssäl, kaptensmössa, diplom och guldbiljett'],
    accessories: { binoculars: 'Kikare', backpack: 'Upptäckarryggsäck', hat: 'Kaptensmössa' },
    captain: 'Gyllene kaptenssäl', slideshow: 'Spela Äventyrsfilm', pause: 'Pausa', play: 'Spela', previous: 'Föregående foto', nextPhoto: 'Nästa foto',
    edit: 'Håll i 3 sekunder för att ändra', save: 'Spara', fika: 'Fikakupong', ticket: 'Stora gyllene äventyrsbiljetten',
    fikaDefault: 'Dags för en mysig fika! Kanelbulle, varm choklad eller glass efter promenaden.',
    ticketDefault: 'Stora valet: Färjetur till Styrsö, besök på Universeum eller picknick i Slottsskogen!',
    gear: 'Riktig upptäckarutrustning', gearText: 'Välj en liten upptäckarpresent tillsammans, till exempel ett förstoringsglas, en ficklampa eller en barnkompass.',
    diploma: 'MinneTrail-kapten', print: 'Dela eller skriv ut diplom', favorite: 'Använd fotot på mitt diplom',
    chosen: 'Diplomfoto valt', count: 'Avklarade uppdrag', celebrate: 'Ny skatt!',
    dismiss: 'Fortsätt upptäcka', sharingError: 'Det gick inte att dela diplomet.',
  },
};

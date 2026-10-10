export type EmojiEntry = { emoji: string; name: string; keywords?: string };
export type EmojiCategory = { id: string; label: string; emoji: EmojiEntry[] };

/** The quick-reaction row, in display order. */
export const QUICK_REACTIONS: EmojiEntry[] = [
  { emoji: '👍', name: 'thumbs up', keywords: 'yes approve ok like +1' },
  {
    emoji: '🎉',
    name: 'party popper',
    keywords: 'tada celebrate done shipped',
  },
  { emoji: '❤️', name: 'red heart', keywords: 'love like' },
  { emoji: '👀', name: 'eyes', keywords: 'looking review watching' },
  {
    emoji: '✅',
    name: 'check mark',
    keywords: 'done passed approved complete',
  },
  { emoji: '🚀', name: 'rocket', keywords: 'launch ship fast' },
];

/** A small, curated set: enough for print-lab chatter without shipping a full emoji database. */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    emoji: [
      { emoji: '😀', name: 'grinning face', keywords: 'happy smile' },
      { emoji: '😂', name: 'tears of joy', keywords: 'laugh lol' },
      { emoji: '🙂', name: 'slightly smiling face', keywords: 'smile' },
      { emoji: '😍', name: 'heart eyes', keywords: 'love beautiful' },
      { emoji: '🤔', name: 'thinking face', keywords: 'hmm question' },
      {
        emoji: '😅',
        name: 'grinning face with sweat',
        keywords: 'phew relief',
      },
      { emoji: '😬', name: 'grimacing face', keywords: 'yikes awkward' },
      { emoji: '😮', name: 'face with open mouth', keywords: 'wow surprised' },
      { emoji: '🤯', name: 'exploding head', keywords: 'mind blown' },
      { emoji: '😴', name: 'sleeping face', keywords: 'tired overnight' },
      { emoji: '🥳', name: 'partying face', keywords: 'celebrate' },
      { emoji: '😢', name: 'crying face', keywords: 'sad failed' },
    ],
  },
  {
    id: 'gestures',
    label: 'Gestures',
    emoji: [
      { emoji: '👍', name: 'thumbs up', keywords: 'yes approve ok like +1' },
      { emoji: '👎', name: 'thumbs down', keywords: 'no reject -1' },
      { emoji: '👏', name: 'clapping hands', keywords: 'applause bravo' },
      { emoji: '🙌', name: 'raising hands', keywords: 'hooray yay' },
      { emoji: '🙏', name: 'folded hands', keywords: 'thanks please' },
      { emoji: '💪', name: 'flexed biceps', keywords: 'strong strength' },
      { emoji: '👌', name: 'ok hand', keywords: 'perfect fine' },
      { emoji: '🤞', name: 'crossed fingers', keywords: 'luck hope' },
      { emoji: '👋', name: 'waving hand', keywords: 'hello hi bye' },
      { emoji: '👀', name: 'eyes', keywords: 'looking review watching' },
    ],
  },
  {
    id: 'lab',
    label: 'Print lab',
    emoji: [
      { emoji: '🖨️', name: 'printer', keywords: 'print form' },
      { emoji: '🔧', name: 'wrench', keywords: 'fix tool maintenance' },
      { emoji: '🔩', name: 'nut and bolt', keywords: 'hardware chassis' },
      { emoji: '🧪', name: 'test tube', keywords: 'resin material test' },
      { emoji: '📐', name: 'triangular ruler', keywords: 'measure tolerance' },
      { emoji: '📦', name: 'package', keywords: 'box ship kit' },
      { emoji: '⏱️', name: 'stopwatch', keywords: 'time print duration' },
      { emoji: '🔥', name: 'fire', keywords: 'hot great cure' },
      { emoji: '🧊', name: 'ice', keywords: 'cold cool' },
      { emoji: '💡', name: 'light bulb', keywords: 'idea' },
      { emoji: '⚙️', name: 'gear', keywords: 'settings mechanism' },
      { emoji: '🛠️', name: 'hammer and wrench', keywords: 'build tools' },
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    emoji: [
      {
        emoji: '✅',
        name: 'check mark',
        keywords: 'done passed approved complete',
      },
      { emoji: '❌', name: 'cross mark', keywords: 'no failed wrong' },
      { emoji: '⚠️', name: 'warning', keywords: 'caution alert' },
      { emoji: '❤️', name: 'red heart', keywords: 'love like' },
      { emoji: '💯', name: 'hundred points', keywords: 'perfect score' },
      { emoji: '⭐', name: 'star', keywords: 'favourite favorite great' },
      {
        emoji: '🎉',
        name: 'party popper',
        keywords: 'tada celebrate done shipped',
      },
      { emoji: '🚀', name: 'rocket', keywords: 'launch ship fast' },
      { emoji: '❓', name: 'question mark', keywords: 'question help' },
      { emoji: '➕', name: 'plus', keywords: 'add more' },
    ],
  },
];

const NAMES = new Map<string, string>();
for (const e of [...QUICK_REACTIONS, ...EMOJI_CATEGORIES.flatMap((c) => c.emoji)]) NAMES.set(e.emoji, e.name);

/** Readable name for an emoji ("party popper"), falling back to the glyph itself. */
export const emojiName = (emoji: string) => NAMES.get(emoji) ?? emoji;

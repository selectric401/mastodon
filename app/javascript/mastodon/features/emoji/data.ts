import type { SkinVariation } from 'emoji-mart/dist-es/utils/data';
import { joinShortcodes } from 'emojibase';
import type { CompactEmoji, Locale, ShortcodesDataset } from 'emojibase';

async function fetchEmojibaseData(
  locale: Locale,
  withShortcodes = true,
): Promise<CompactEmoji[]> {
  const { default: emojiData } = (await import(
    `emojibase-data/${locale}/compact.json`
  )) as { default: CompactEmoji[] };
  if (!withShortcodes) {
    return emojiData;
  }
  const shortcodes = (await import(
    `emojibase-data/${locale}/shortcodes/cldr.json`
  )) as ShortcodesDataset;

  return joinShortcodes(emojiData, [shortcodes]);
}

export async function fetchEmojiMartData() {
  const { default: data } = await import('emoji-datasource/emoji.json');
  return data;
}

export type UnicodeMapping = Record<string, string>;

export async function emojibaseToUnicodeMapping(
  locale: Locale,
): Promise<UnicodeMapping> {
  const emojibaseCompactEmojis = await fetchEmojibaseData(locale, false);

  const mapping: UnicodeMapping = {};

  for (const emoji of emojibaseCompactEmojis) {
    mapping[emoji.hexcode] = emoji.label;
  }

  return mapping;
}

export interface EmojiMartCompactEmoji {
  hexcode: string;
  x: number;
  y: number;
  labels?: string[];
  skins?: Omit<EmojiMartCompactEmoji, 'skins' | 'labels'>[];
}

export async function emojibaseToEmojiMart(
  locale: Locale,
): Promise<EmojiMartCompactEmoji[]> {
  const emojibaseCompactEmojis = await fetchEmojibaseData(locale, true);
  const emojiMartData = await fetchEmojiMartData();

  const emojibaseMap = new Map<string, CompactEmoji>();
  for (const emoji of emojibaseCompactEmojis) {
    emojibaseMap.set(emoji.hexcode, emoji);
  }

  const emojis: EmojiMartCompactEmoji[] = [];
  for (const emoji of emojiMartData) {
    const emojibaseEmoji = emojibaseMap.get(emoji.unified);
    let skins: EmojiMartCompactEmoji['skins'];
    if (emoji.skin_variations) {
      skins = Object.values(emoji.skin_variations).map(
        (skin: SkinVariation) => ({
          hexcode: skin.unified,
          x: skin.sheet_x,
          y: skin.sheet_y,
        }),
      );
    }
    emojis.push({
      hexcode: emoji.unified,
      x: emoji.sheet_x,
      y: emoji.sheet_y,
      labels: emojibaseEmoji?.shortcodes,
      skins,
    });
  }
  return emojis;
}

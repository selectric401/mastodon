import type {
  Category,
  Data as EmojiMartData,
  SkinVariation,
} from 'emoji-mart/dist-es/utils/data';
import { joinShortcodes } from 'emojibase';
import type {
  CompactEmoji,
  Locale,
  MessagesDataset,
  ShortcodesDataset,
} from 'emojibase';

async function fetchEmojibaseData(locale: Locale): Promise<CompactEmoji[]> {
  const [emojiData, shortcodes] = await Promise.all([
    import(`emojibase-data/${locale}/compact.json`) as Promise<CompactEmoji[]>,
    import(
      `emojibase-data/${locale}/shortcodes/cldr.json`
    ) as Promise<ShortcodesDataset>,
  ]);

  return joinShortcodes(emojiData, [shortcodes]);
}

function fetchEmojibaseMessages(locale: Locale): Promise<MessagesDataset> {
  return import(`emojibase-data/${locale}/messages.json`);
}

export async function fetchEmojiMartData() {
  const { default: data } = await import('./emoji_data.json');
  return data;
}

/*
{
	"man-rowing-boat":{
		"a":"Man Rowing Boat",
		"b":"1F6A3-200D-2642-FE0F",
		"f":true,
		"k":[
			36,
			36
		],
		"c":"1F6A3-200D-2642",
		"j":[
			"person_rowing_boat",
			"sport",
			"move"
		],
		"skin_variations":{
			"1F3FB":{
				"unified":"1F6A3-1F3FB-200D-2642-FE0F",
				"non_qualified":"1F6A3-1F3FB-200D-2642",
				"image":"1f6a3-1f3fb-200d-2642-fe0f.png",
				"sheet_x":36,
				"sheet_y":37,
				"added_in":"4.0",
				"has_img_apple":true,
				"has_img_google":true,
				"has_img_twitter":true,
				"has_img_facebook":true
			},
		}
	}
}
*/

export async function emojibaseToEmojiMart(
  locale: Locale,
): Promise<EmojiMartData> {
  const emojibaseCompactEmojis = await fetchEmojibaseData(locale);
  const emojibaseMessages = await fetchEmojibaseMessages(locale);

  const groupNumToEmojiMap = new Map<number, Set<string>>();
  const emojis: EmojiMartData['emojis'] = {};
  const aliases: EmojiMartData['aliases'] = {};
  for (const emoji of emojibaseCompactEmojis) {
    const shortcode = emoji.shortcodes?.at(0);
    if (!shortcode || !emoji.shortcodes) {
      continue; // Skip emojis without shortcodes
    }

    for (const alias of emoji.shortcodes.slice(1)) {
      aliases[alias] = shortcode;
    }

    if (emoji.group) {
      const existingEmojis =
        groupNumToEmojiMap.get(emoji.group) ?? new Set<string>();
      existingEmojis.add(shortcode);
      groupNumToEmojiMap.set(emoji.group, existingEmojis);
    }

    emojis[shortcode] = {
      name: emoji.label,
      unified: emoji.hexcode,
      has_img_twitter: true,
      sheet_x: 0,
      sheet_y: 0,
      keywords: emoji.tags,
      skin_variations: emoji.skins?.reduce(
        (acc, skin) => ({
          ...acc,
          [skin.hexcode]: {
            unified: skin.hexcode,
            non_qualified: skin.hexcode,
            image: skin.hexcode,
            sheet_x: 0,
            sheet_y: 0,
            added_in: '1.0', // Placeholder, should be set based on actual version
            has_img_apple: true,
            has_img_google: true,
            has_img_twitter: true,
            has_img_facebook: true,
          },
        }),
        {} as Record<string, SkinVariation>,
      ),
    };
  }

  const categories: Category[] = emojibaseMessages.groups.map(
    (group, index) => ({
      id: group.key,
      name: group.message,
      emojis: groupNumToEmojiMap.get(index)?.values().toArray() ?? [],
    }),
  );
  return {
    compressed: false,
    categories,
    emojis,
    aliases,
  };
}

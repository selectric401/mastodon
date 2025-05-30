import type { Emoji } from 'emoji-mart/dist-es/utils/data';

import type { ApiCustomEmojiJSON } from '@/mastodon/api_types/custom_emoji';
import { autoPlayGif } from '@/mastodon/initial_state';

export interface CustomEmojiInput extends ApiCustomEmojiJSON {
  name: string;
}

export interface CustomEmoji extends Emoji {
  id: string;
  imageUrl: string;
  custom: true;
  customCategory?: string;
}

export function buildCustomEmojis(customEmojis: CustomEmojiInput[]) {
  const emojis: CustomEmoji[] = [];

  customEmojis.forEach((emoji) => {
    const shortcode = emoji.shortcode;
    const url = autoPlayGif ? emoji.url : emoji.static_url;
    const name = shortcode.replace(':', '');

    emojis.push({
      id: name, // TODO: Figure out if this is needed.
      name,
      short_names: [name],
      text: '',
      emoticons: [],
      keywords: [name],
      imageUrl: url,
      custom: true,
      customCategory: emoji.category,
    });
  });

  return emojis;
}

export function categoriesFromEmojis(customEmojis: CustomEmojiInput[]) {
  return customEmojis.reduce(
    (set, { category }) => set.add(category ? `custom-${category}` : 'custom'),
    new Set(['custom']),
  );
}

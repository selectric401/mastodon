/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Locale } from 'emojibase';
import { SUPPORTED_LOCALES } from 'emojibase';

import { emojibaseToEmojiMart, emojibaseToUnicodeMapping } from './data';

const projectRoot = process.cwd();
const emojiPath = path.resolve(projectRoot, 'public/emoji');

async function calculateLocales() {
  // Get a list of all locales we support.
  const localeFilesPath = path.resolve(
    projectRoot,
    'app/javascript/mastodon/locales',
  );
  const localeDir = await fs.readdir(localeFilesPath, 'utf-8');
  const appLocales: string[] = [];
  for (const file of localeDir) {
    if (file.endsWith('.json')) {
      appLocales.push(path.basename(file, '.json').toLowerCase());
    }
  }
  // Get the intersection of supported locales and app locales and generate emoji JSON files for those.
  return SUPPORTED_LOCALES.filter((locale) =>
    appLocales.includes(locale.toLowerCase()),
  );
}

async function generateAllEmojiJsonFiles() {
  const emojiLocalePath = path.resolve(emojiPath, 'locales');
  const emojiLocales = await calculateLocales();
  await fs.mkdir(emojiLocalePath, { recursive: true }); // Ensure the locales directory exists
  await Promise.all(
    emojiLocales.map((locale) => writeEmojiLocaleJson(locale, emojiLocalePath)),
  );
  console.log(
    `Generated emoji JSON files for locales: ${emojiLocales.join(', ')}`,
  );
}

async function writeEmojiLocaleJson(locale: Locale, dirPath: string) {
  const mapping = await emojibaseToUnicodeMapping(locale);
  const filePath = path.join(dirPath, `${locale}.json`);
  await fs.writeFile(filePath, JSON.stringify(mapping, null, 2), 'utf-8');
}

async function generateEmojiSheetMappingJson() {
  const emojiMetaPath = path.resolve(emojiPath, 'meta');
  await fs.mkdir(emojiMetaPath, { recursive: true }); // Ensure the meta directory exists
  const locales = await calculateLocales();
  await Promise.all(
    locales.map((locale) => writeEmojiMappingJson(locale, emojiMetaPath)),
  );
}

async function writeEmojiMappingJson(locale: Locale, dirPath: string) {
  const mapping = await emojibaseToEmojiMart(locale);
  const filePath = path.join(dirPath, `${locale}.json`);
  await fs.writeFile(filePath, JSON.stringify(mapping, null, 2), 'utf-8');
}

Promise.all([generateAllEmojiJsonFiles(), generateEmojiSheetMappingJson()])
  .then(() => process.exit())
  .catch(console.error);

import 'dotenv/config';
import { Client, Events } from '@fluxerjs/core';
import { generateQuote } from './quote.js';

const TOKEN = process.env.FLUXER_BOT_TOKEN;
if (!TOKEN) {
  console.error('FLUXER_BOT_TOKEN is not set.');
  process.exit(1);
}

const client = new Client({ intents: 0 });

client.on(Events.Ready, () => console.log('miq-bot online'));

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content) return;

  const botMentioned =
    message.mentions?.users?.has(client.user.id) ||
    message.content.includes(`<@${client.user.id}>`);
  if (!botMentioned) return;

  if (!message.referencedMessage) {
    await message.reply('Reply to a message and ping me to turn it into a quote card!');
    return;
  }

  const ref = message.referencedMessage;
  if (!ref.content) {
    await message.reply('That message has no text to quote.');
    return;
  }

  const text = ref.content.length > 500
    ? ref.content.slice(0, 497) + '...'
    : ref.content;
  const targetUser = ref.author;
  const discriminator = targetUser.discriminator && targetUser.discriminator !== '0'
    ? `#${targetUser.discriminator}`
    : '';

  try {
    const botUser = client.user;
    const botDiscriminator = botUser.discriminator && botUser.discriminator !== '0'
      ? `#${botUser.discriminator}`
      : '';
    const imageBuffer = await generateQuote({
      text,
      displayName: targetUser.displayName ?? targetUser.username,
      tag: `${targetUser.username}${discriminator}`,
      avatarUrl: targetUser.displayAvatarURL({ size: 512 }),
      botTag: `${botUser.username}${botDiscriminator}`,
    });
    await message.reply({ files: [{ name: 'quote.png', data: imageBuffer }] });
  } catch (err) {
    console.error('Quote generation failed:', err);
    await message.reply('Something went wrong generating the quote.');
  }
});

client.on(Events.Error, (err) => console.error('Client error:', err));

await client.login(TOKEN);

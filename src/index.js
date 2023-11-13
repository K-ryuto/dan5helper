/**
 * The core server that runs on a Cloudflare worker.
 */

import { Router } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { ADD_ACOUNT, AWW_COMMAND, INVITE_COMMAND } from './commands.js';
import { getCuteUrl } from './reddit.js';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const router = Router();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${"1173135045339398204"}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.member.user.username)
    try {
      await env.DB.prepare(
        `INSERT INTO log(timestamp,player_id,player_name,command,other) VALUES (${Date.now()},"${interaction.member.user.id}","${interaction.member.user.username}",'${JSON.stringify(interaction.data)}',"none")`
      ).run()
    } catch (error) {
      console.log(error)
    }
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case AWW_COMMAND.name.toLowerCase(): {
        // 入力されたAPIキーをlocalStorageに保存
        // POST送信用にFormDataオブジェクトに変換
        const form = new FormData()
        form.append('key', interaction.data.options[0].value)
        // PHPにリクエストを投げる
        const init = {
          method: 'POST',
          body: form
        };

        const f = await fetch('https://man10test.cloudfree.jp/shop.php', init)
          .then((response) => {
            return response.json(); // or .text() or .blob() ...
          })
          .then((text) => {
            return text
            // text is the response body
          })
          .catch((e) => {
            console.log(e)
          });
        console.log(f[interaction.data.options[1].value - 0])
        const exampleEmbed = [{
          "fields": [
            { "name": `sohp ID[${interaction.data.options[1].value - 0}]`, "value": `${f[interaction.data.options[1].value - 0].shopId}` },
            { "name": `shop name`, "value": `${f[interaction.data.options[1].value - 0].name}` },
            { "name": `shop type`, "value": `${f[interaction.data.options[1].value - 0].shopType}` },
            { "name": `Item count`, "value": `${f[interaction.data.options[1].value - 0].itemCount}` },
            { "name": `shop money`, "value": `${f[interaction.data.options[1].value - 0].money}` },
          ],
          "color": (f[interaction.data.options[1].value - 0].shopType == "買取ショップ") ? 0x00FF00 : 0xFF0000,
        }];
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: exampleEmbed,
            // flags: InteractionResponseFlags.EPHEMERAL,
          }
        });
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        const applicationId = "1173135045339398204";
        const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: INVITE_URL,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }
      case ADD_ACOUNT.name.toLowerCase(): {
        var u_data = []
        try {
          u_data[0] =
            await env.DB.prepare(
              `SELECT u_name FROM players WHERE u_name = "${interaction.data.options[0].value}"`
            ).all();
          u_data[1] =
            await env.DB.prepare(
              `SELECT u_name FROM players WHERE u_d_id = "${interaction.member.user.id}"`
            ).all();
          if (u_data[0].results == "" && u_data[1].results == "") {
            const data = await fetch(`https://api.mojang.com/users/profiles/minecraft/${interaction.data.options[0].value}`)
              .then((response) => response.json())
            await env.DB.prepare(
              `INSERT INTO players VALUES (1,"${interaction.data.options[0].value}","${data.id}","${interaction.member.user.id}","${Date.now()}",0,"none","none",0)`
            ).all()
          }
        } catch (error) {
          console.log(error)
        }
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "success !",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }
      default:
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, "");
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async function (request, env) {
    return router.handle(request, env);
  },
};

export default server;

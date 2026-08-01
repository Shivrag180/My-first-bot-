# Professional Discord.js v14 Bot

## Auto Global Slash Command Registration
Slash commands are registered automatically from `index.js` every time the bot starts.
You do NOT need to run `node deploy-commands.js`.

## OptiKLink
1. Keep `.env` with:
   `TOKEN=YOUR_BOT_TOKEN`
   `CLIENT_ID=YOUR_APPLICATION_ID`
2. Start the bot with:
   `node index.js`
3. Console should show:
   `🔄 Registering XX global slash commands...`
   `✅ Successfully registered XX global slash commands.`

Global slash commands may take a little time to appear in Discord.


## Welcome / Leave Test Commands
- `/welcometest` — sends a test welcome embed to the configured welcome channel.
- `/leavetest` — sends a test leave embed to the configured leave channel.

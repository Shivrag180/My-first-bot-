require("dotenv").config();
const { REST, Routes } = require("discord.js");
const commandModule = require("./commands/commands.js");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
  console.error("❌ TOKEN is missing in .env");
  process.exit(1);
}

if (!clientId) {
  console.error("❌ CLIENT_ID is missing in .env");
  process.exit(1);
}

const commands = Array.isArray(commandModule)
  ? commandModule
  : (commandModule.commands || []);

const body = commands
  .filter(command => command && command.data && typeof command.data.toJSON === "function")
  .map(command => command.data.toJSON());

if (!body.length) {
  console.error("❌ No slash commands found to register.");
  process.exit(1);
}

(async () => {
  console.log(`🔄 Registering ${body.length} global slash commands...`);

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    const result = await rest.put(
      Routes.applicationCommands(clientId),
      { body }
    );

    console.log(`✅ Successfully registered ${result.length} global slash commands.`);
    console.log("🌍 Commands are registered globally.");
    console.log("⏳ Global commands may take a little time to appear in Discord.");
  } catch (error) {
    console.error("❌ Slash command registration failed.");
    console.error(error);
    process.exit(1);
  }
})();

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const commands = require("./commands/commands.js");

const TOKEN = process.env.TOKEN || process.env.BOT_TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || process.env.CLIENTID || process.env.APPLICATION_ID;
const GUILD_ID = process.env.GUILD_ID || process.env.GUILDID || process.env.SERVER_ID || null;

if (!TOKEN) console.error("❌ Bot token is missing.");
if (!CLIENT_ID) console.error("❌ CLIENT_ID is missing.");

const USER_DATA_FILE = path.join(__dirname, "user-data.json");
let userData = { warnings: {}, afk: {} };
try { if (fs.existsSync(USER_DATA_FILE)) userData = { ...userData, ...JSON.parse(fs.readFileSync(USER_DATA_FILE, "utf8")) }; } catch (e) {}
function saveUserData() { try { fs.writeFileSync(USER_DATA_FILE, JSON.stringify(userData, null, 2)); } catch (e) { console.error(e); } }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const DATA_FILE = path.join(__dirname, "data.json");
let data = { welcomeChannel: {}, leaveChannel: {} };
try {
  if (fs.existsSync(DATA_FILE)) data = { ...data, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
} catch (e) {
  console.error("❌ Could not load data.json:", e);
}

function saveData() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
  catch (e) { console.error("❌ Could not save data:", e); }
}

function isValidImageUrl(value) {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
  } catch {
    return false;
  }
}

function welcomeEmbed(member, test=false) {
  const cfg = data.guilds?.[member.guild.id]?.welcome || {};
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("👋 Welcome")
    .setDescription(`Welcome ${member} to **${member.guild.name}'s server**!`)
    .addFields(
      { name: "👤 User", value: member.user.username, inline: false },
      { name: "🆔 User ID", value: member.id, inline: false },
      { name: "👥 Member Count", value: String(member.guild.memberCount), inline: false }
    );
  if (isValidImageUrl(cfg.image)) embed.setImage(cfg.image);
  return embed;
}

function goodbyeEmbed(member) {
  const cfg = data.guilds?.[member.guild.id]?.leave || {};
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("👋 Goodbye")
    .setDescription(`Goodbye ${member} from **${member.guild.name}'s server**!`)
    .addFields(
      { name: "👤 User", value: member.user.username, inline: false },
      { name: "🆔 User ID", value: member.id, inline: false },
      { name: "👥 Member Count", value: String(member.guild.memberCount), inline: false }
    );
  if (isValidImageUrl(cfg.image)) embed.setImage(cfg.image);
  return embed;
}

function ticketButtons(open=true) {
  if (!open) return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_reopen").setLabel("Reopen Ticket").setEmoji("🔓").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_delete").setLabel("Delete Ticket").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("Close Ticket").setEmoji("🔒").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_claim").setLabel("Claim Ticket").setEmoji("📌").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_add_user").setLabel("Add User").setEmoji("👤").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("ticket_remove_user").setLabel("Remove User").setEmoji("🚫").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_delete").setLabel("Delete Ticket").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );
}

const commandMap = new Map();
for (const c of commands) {
  if (c && c.data && typeof c.data.toJSON === "function") commandMap.set(c.data.name, c);
}
const commandBody = commands
  .filter(c => c && c.data && typeof c.data.toJSON === "function")
  .map(c => c.data.toJSON());

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandBody });
      console.log(`✅ Registered ${commandBody.length} slash commands in guild ${GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandBody });
      console.log(`✅ Registered ${commands.length} global slash commands`);
    }
  } catch (e) {
    console.error("❌ Slash command registration failed:", e);
  }
});

client.on("guildMemberAdd", async member => {
  const cfg = data.guilds?.[member.guild.id]?.welcome || {};
  const channelId = cfg.channelId || data.welcomeChannel?.[member.guild.id];
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  await channel.send({ content: `Welcome ${member}`, embeds: [welcomeEmbed(member)] }).catch(console.error);
});

client.on("guildMemberRemove", async member => {
  const cfg = data.guilds?.[member.guild.id]?.leave || {};
  const channelId = cfg.channelId || data.leaveChannel?.[member.guild.id];
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;
  await channel.send({ content: `Goodbye ${member}`, embeds: [goodbyeEmbed(member)] }).catch(console.error);
});

client.on("interactionCreate", async interaction => {
  try {
    // ===== BUTTONS =====
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === "ticket_create") {
        const existing = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText &&
          c.topic === `ticket-owner:${interaction.user.id}`
        );
        if (existing) return interaction.reply({ content: `❌ You already have a ticket: ${existing}`, ephemeral: true });

        const ticketConfig = data.guilds?.[interaction.guild.id]?.ticket || {};
        const overwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
        ];
        if (ticketConfig.staffRoleId) {
          overwrites.push({
            id: ticketConfig.staffRoleId,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
          });
        }

        const ticket = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90),
          type: ChannelType.GuildText,
          parent: ticketConfig.categoryId || undefined,
          topic: `ticket-owner:${interaction.user.id}`,
          permissionOverwrites: overwrites
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("🎫 Ticket Created")
          .setDescription(`Welcome ${interaction.user}! Please describe your issue.`);
        await ticket.send({ content: `${interaction.user}`, embeds: [embed], components: [ticketButtons()] });
        return interaction.reply({ content: `✅ Ticket created: ${ticket}`, ephemeral: true });
      }

      if (id.startsWith("ticket_")) {
        if (!interaction.channel?.topic?.startsWith("ticket-owner:"))
          return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });

        const ownerId = interaction.channel.topic.split(":")[1];
        const isStaff = interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);

        if (id === "ticket_close") {
          if (!isStaff && interaction.user.id !== ownerId)
            return interaction.reply({ content: "❌ You cannot close this ticket.", ephemeral: true });
          await interaction.channel.permissionOverwrites.edit(ownerId, { SendMessages: false }).catch(() => {});
          return interaction.update({ content: "🔒 **Ticket closed.**", components: [ticketButtons(false)] });
        }

        if (id === "ticket_reopen") {
          if (!isStaff) return interaction.reply({ content: "❌ Only staff can reopen tickets.", ephemeral: true });
          await interaction.channel.permissionOverwrites.edit(ownerId, { SendMessages: true }).catch(() => {});
          return interaction.update({ content: "🔓 **Ticket reopened.**", components: [ticketButtons()] });
        }

        if (id === "ticket_claim") {
          if (!isStaff) return interaction.reply({ content: "❌ Only staff can claim tickets.", ephemeral: true });
          return interaction.reply({ content: `📌 Ticket claimed by ${interaction.user}.` });
        }

        if (id === "ticket_add_user" || id === "ticket_remove_user") {
          if (!isStaff) return interaction.reply({ content: "❌ Only staff can manage users.", ephemeral: true });
          return interaction.reply({ content: "ℹ️ Use channel permissions to add or remove a user.", ephemeral: true });
        }

        if (id === "ticket_delete") {
          if (!isStaff) return interaction.reply({ content: "❌ Only staff can delete tickets.", ephemeral: true });
          await interaction.reply({ content: "🗑️ Deleting ticket...", ephemeral: true });
          setTimeout(() => interaction.channel.delete().catch(() => {}), 800);
          return;
        }
      }
      return;
    }

    // ===== SLASH COMMANDS =====
    if (!interaction.isChatInputCommand()) return;
    const name = interaction.commandName;

    // Execute commands from commands/commands.js
    const registeredCommand = commandMap.get(name);
    if (registeredCommand && typeof registeredCommand.execute === "function") {
      const ctx = {
        EmbedBuilder,
        PermissionsBitField,
        cfg: (guildId) => {
          data.guilds ??= {};
          data.guilds[guildId] ??= { welcome: {}, leave: {}, ticket: {} };
          const g = data.guilds[guildId];
          // Keep compatibility with the older welcome/leave storage.
          g.welcome ??= {};
          g.leave ??= {};
          if (!g.welcome.channelId && data.welcomeChannel?.[guildId]) g.welcome.channelId = data.welcomeChannel[guildId];
          if (!g.leave.channelId && data.leaveChannel?.[guildId]) g.leave.channelId = data.leaveChannel[guildId];
          return g;
        },
        save: () => {
          data.welcomeChannel ??= {};
          data.leaveChannel ??= {};
          for (const [gid, g] of Object.entries(data.guilds ?? {})) {
            if (g.welcome?.channelId) data.welcomeChannel[gid] = g.welcome.channelId;
            if (g.leave?.channelId) data.leaveChannel[gid] = g.leave.channelId;
          }
          saveData();
        },
        db: data,
        userData,
        saveUserData
      };
      return await registeredCommand.execute(interaction, ctx);
    }

    if (name === "setwelcome") {
      const channel = interaction.options.getChannel("channel");
      data.welcomeChannel[interaction.guild.id] = channel.id; saveData();
      return interaction.reply({ content: `✅ Welcome channel set to ${channel}`, ephemeral: true });
    }

    if (name === "welcometest") {
      const fake = { user: interaction.user, id: interaction.user.id, guild: interaction.guild, toString: () => `${interaction.user}` };
      return interaction.reply({ content: `Welcome ${interaction.user}`, embeds: [welcomeEmbed(fake, true)] });
    }

    if (name === "setleave") {
      const channel = interaction.options.getChannel("channel");
      data.leaveChannel[interaction.guild.id] = channel.id; saveData();
      return interaction.reply({ content: `✅ Goodbye channel set to ${channel}`, ephemeral: true });
    }

    if (name === "leavetest") {
      const fake = { user: interaction.user, id: interaction.user.id, guild: interaction.guild, toString: () => `${interaction.user}` };
      return interaction.reply({ content: `Goodbye ${interaction.user}`, embeds: [goodbyeEmbed(fake)] });
    }

    if (name === "setticket") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
        return interaction.reply({ content: "❌ You need Manage Server permission.", ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 Support Ticket")
        .setDescription("Click **🎫 Create Ticket** to open a private support ticket.");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_create").setLabel("Create Ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
      );
      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: "✅ Ticket panel sent.", ephemeral: true });
    }

    if (name === "kick") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "❌ Member not found.", ephemeral: true });
      await member.kick(reason);
      return interaction.reply(`👢 ${user.tag} has been kicked.`);
    }

    if (name === "ban") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided";
      await interaction.guild.members.ban(user.id, { reason });
      return interaction.reply(`🔨 ${user.tag} has been banned.`);
    }

    if (name === "unban") {
      const userId = interaction.options.getString("userid");
      await interaction.guild.members.unban(userId);
      return interaction.reply(`🔓 User ${userId} has been unbanned.`);
    }

    if (name === "timeout") {
      const user = interaction.options.getUser("user");
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || "No reason provided";
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: "❌ Member not found.", ephemeral: true });
      await member.timeout(minutes * 60 * 1000, reason);
      return interaction.reply(`⏱️ ${user.tag} timed out for ${minutes} minute(s).`);
    }

    if (name === "announce") {
      const msg = interaction.options.getString("message");
      await interaction.channel.send({ content: `📢 **Announcement**\n\n${msg}` });
      return interaction.reply({ content: "✅ Announcement sent.", ephemeral: true });
    }

    
    if (name === "userinfo") {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;
      const e = new EmbedBuilder().setColor(0x5865F2).setTitle(`👤 User Info — ${user.username}`).setThumbnail(user.displayAvatarURL({size:256}))
        .addFields({name:"👤 Username",value:user.tag,inline:true},{name:"🆔 User ID",value:user.id,inline:true},{name:"🤖 Bot",value:user.bot?"Yes":"No",inline:true},{name:"📅 Account Created",value:`<t:${Math.floor(user.createdTimestamp/1000)}:F>`});
      if(member) e.addFields({name:"📥 Joined Server",value:`<t:${Math.floor(member.joinedTimestamp/1000)}:F>`},{name:"🎭 Roles",value:member.roles.cache.filter(r=>r.id!==interaction.guild.id).map(r=>r.toString()).slice(0,20).join(", ")||"None"});
      return interaction.reply({embeds:[e]});
    }
    if (name === "serverinfo") {
      const g=interaction.guild;
      return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🛡️ Server Info — ${g.name}`).setThumbnail(g.iconURL({size:256}))
        .addFields({name:"🆔 Server ID",value:g.id,inline:true},{name:"👑 Owner",value:`<@${g.ownerId}>`,inline:true},{name:"👥 Members",value:String(g.memberCount),inline:true},{name:"💬 Channels",value:String(g.channels.cache.size),inline:true},{name:"🎭 Roles",value:String(g.roles.cache.size),inline:true},{name:"📅 Created",value:`<t:${Math.floor(g.createdTimestamp/1000)}:F>`})]});
    }
    if (name === "avatar") {
      const u=interaction.options.getUser("user")||interaction.user;
      return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🖼️ Avatar — ${u.username}`).setImage(u.displayAvatarURL({size:1024}))]});
    }
    if (name === "banner") {
      const u=await (interaction.options.getUser("user")||interaction.user).fetch(), url=u.bannerURL({size:1024});
      if(!url) return interaction.reply({content:"❌ This user does not have a profile banner.",ephemeral:true});
      return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🖼️ Banner — ${u.username}`).setImage(url)]});
    }
    if (name === "roleinfo") {
      const r=interaction.options.getRole("role");
      return interaction.reply({embeds:[new EmbedBuilder().setColor(r.color||0x5865F2).setTitle(`🎭 Role Info — ${r.name}`).addFields({name:"🆔 Role ID",value:r.id,inline:true},{name:"👥 Members",value:String(r.members.size),inline:true},{name:"📌 Position",value:String(r.position),inline:true},{name:"🔗 Mentionable",value:r.mentionable?"Yes":"No",inline:true})]});
    }
    if (name === "channelinfo") {
      const c=interaction.options.getChannel("channel")||interaction.channel;
      return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`💬 Channel Info — #${c.name}`).addFields({name:"🆔 Channel ID",value:c.id,inline:true},{name:"📁 Type",value:String(c.type),inline:true},{name:"📅 Created",value:`<t:${Math.floor(c.createdTimestamp/1000)}:F>`})]});
    }
    if (name === "poll") {
      const q=interaction.options.getString("question"), msg=await interaction.reply({content:`📊 **Poll**\n\n${q}\n\n👍 Yes  |  👎 No`,fetchReply:true});
      await msg.react("👍").catch(()=>{}); await msg.react("👎").catch(()=>{}); return;
    }
    if (name === "say") {
      if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({content:"❌ You need Manage Messages permission.",ephemeral:true});
      await interaction.channel.send(interaction.options.getString("message")); return interaction.reply({content:"✅ Message sent.",ephemeral:true});
    }
    if (name === "embed") {
      if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply({content:"❌ You need Manage Messages permission.",ephemeral:true});
      const e=new EmbedBuilder().setColor(0x5865F2).setTitle(interaction.options.getString("title")).setDescription(interaction.options.getString("description"));
      await interaction.channel.send({embeds:[e]}); return interaction.reply({content:"✅ Embed sent.",ephemeral:true});
    }
    if (name === "warn") {
      if(!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return interaction.reply({content:"❌ You need Moderate Members permission.",ephemeral:true});
      const u=interaction.options.getUser("user"), key=`${interaction.guild.id}:${u.id}`, reason=interaction.options.getString("reason")||"No reason provided";
      userData.warnings[key]=userData.warnings[key]||[]; userData.warnings[key].push({moderator:interaction.user.id,reason,timestamp:Date.now()}); saveUserData();
      return interaction.reply(`⚠️ ${u.tag} has been warned. Reason: ${reason}`);
    }
    if (name === "warnings") {
      const u=interaction.options.getUser("user")||interaction.user, list=userData.warnings[`${interaction.guild.id}:${u.id}`]||[];
      return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`⚠️ Warnings — ${u.tag}`).setDescription(list.length?list.map((w,i)=>`**${i+1}.** ${w.reason} — <@${w.moderator}>`).join("\n"):"No warnings found.")]});
    }
    if (name === "afk") {
      const reason=interaction.options.getString("reason")||"AFK"; userData.afk[`${interaction.guild.id}:${interaction.user.id}`]={reason,timestamp:Date.now()}; saveUserData();
      return interaction.reply(`💤 ${interaction.user}, you are now AFK. Reason: ${reason}`);
    }
    if (name === "membercount") return interaction.reply(`👥 **${interaction.guild.name}** has **${interaction.guild.memberCount}** members.`);
    if (name === "botinfo") return interaction.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(`🤖 ${client.user.username} Info`).setThumbnail(client.user.displayAvatarURL()).addFields({name:"🆔 Bot ID",value:client.user.id,inline:true},{name:"📡 Ping",value:`${client.ws.ping}ms`,inline:true},{name:"🛡️ Servers",value:String(client.guilds.cache.size),inline:true})]});
    if (name === "ping") return interaction.reply(`🏓 Pong! **${client.ws.ping}ms**`);
    if (name === "help") {
      const e=new EmbedBuilder().setColor(0x5865F2).setTitle("📚 All Commands").setDescription("All available slash commands:")
        .addFields(
          {name:"⚙️ Setup",value:"`/setwelcome` `/setleave` `/disablewelcome` `/disableleave` `/setticket`",inline:false},
          {name:"🛡️ Moderation",value:"`/kick` `/ban` `/unban` `/untimeout` `/clear` `/lock` `/unlock` `/slowmode` `/purge` `/warn` `/warnings`",inline:false},
          {name:"👤 User & Server",value:"`/userinfo` `/serverinfo` `/avatar` `/banner` `/roleinfo` `/channelinfo` `/membercount` `/botinfo`",inline:false},
          {name:"🛠️ Utility",value:"`/announce` `/poll` `/say` `/embed` `/afk` `/ping`",inline:false},
          {name:"👋 Welcome / Goodbye",value:"`/welcometest` `/leavetest`",inline:false},
          {name:"🎫 Ticket",value:"`/setticket` — Ticket panel and buttons",inline:false}
        );
      return interaction.reply({embeds:[e]});
    }

return interaction.reply({ content: "❌ Command handler not found.", ephemeral: true });
  } catch (error) {
    console.error("❌ Interaction error:", error);
    if (interaction.replied || interaction.deferred) return;
    return interaction.reply({ content: "❌ Something went wrong while processing this command.", ephemeral: true }).catch(() => {});
  }
});

client.login(TOKEN).catch(err => console.error("❌ Login failed:", err));

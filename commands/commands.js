const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder } = require("discord.js");

const commands = [];

function cmd(data, execute) { commands.push({ data, execute }); }
const admin = (b) => b.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

cmd(new SlashCommandBuilder().setName("userinfo").setDescription("Show detailed information about a user").addUserOption(o=>o.setName("user").setDescription("User").setRequired(false)),
async (i)=>{ const u=i.options.getUser("user")||i.user; const m=await i.guild.members.fetch(u.id).catch(()=>null); const e=new EmbedBuilder().setColor(0x5865F2).setTitle("👤 User Information").setThumbnail(u.displayAvatarURL({size:512})).addFields({name:"👤 User",value:`${u.tag}`,inline:true},{name:"🆔 User ID",value:u.id,inline:true},{name:"📅 Account Created",value:`<t:${Math.floor(u.createdTimestamp/1000)}:F>`,inline:false}); if(m)e.addFields({name:"📅 Joined Server",value:`<t:${Math.floor(m.joinedTimestamp/1000)}:F>`,inline:false},{name:"🎭 Roles",value:`${Math.max(0,m.roles.cache.size-1)}`,inline:true}); return i.reply({embeds:[e]}); });

cmd(new SlashCommandBuilder().setName("serverinfo").setDescription("Show detailed information about this server"),
async (i)=>{ const g=i.guild; const e=new EmbedBuilder().setColor(0x5865F2).setTitle(`🏠 ${g.name} — Server Information`).setThumbnail(g.iconURL({size:512})).addFields({name:"🆔 Server ID",value:g.id,inline:true},{name:"👑 Owner",value:`<@${g.ownerId}>`,inline:true},{name:"👥 Members",value:String(g.memberCount),inline:true},{name:"💬 Channels",value:String(g.channels.cache.size),inline:true},{name:"🎭 Roles",value:String(g.roles.cache.size),inline:true},{name:"😀 Emojis",value:String(g.emojis.cache.size),inline:true},{name:"📅 Created",value:`<t:${Math.floor(g.createdTimestamp/1000)}:F>`,inline:false}); return i.reply({embeds:[e]}); });

cmd(new SlashCommandBuilder().setName("avatar").setDescription("Show a user avatar").addUserOption(o=>o.setName("user").setDescription("User").setRequired(false)),
async (i)=>{const u=i.options.getUser("user")||i.user; const e=new EmbedBuilder().setColor(0x5865F2).setTitle(`🖼️ ${u.tag}'s Avatar`).setImage(u.displayAvatarURL({size:2048,extension:"png"})); return i.reply({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("banner").setDescription("Show a user banner").addUserOption(o=>o.setName("user").setDescription("User").setRequired(false)),
async (i)=>{const u=i.options.getUser("user")||i.user; const full=await i.client.users.fetch(u.id,{force:true}); const e=new EmbedBuilder().setColor(0x5865F2).setTitle(`🎨 ${full.tag}'s Banner`); if(full.banner)e.setImage(full.bannerURL({size:2048,extension:"png"})); else e.setDescription("❌ This user does not have a profile banner."); return i.reply({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("roleinfo").setDescription("Show information about a role").addRoleOption(o=>o.setName("role").setDescription("Role").setRequired(true)),
async (i)=>{const r=i.options.getRole("role"); const e=new EmbedBuilder().setColor(r.color||0x5865F2).setTitle("🎭 Role Information").addFields({name:"Name",value:r.name,inline:true},{name:"🆔 ID",value:r.id,inline:true},{name:"👥 Members",value:String(r.members.size),inline:true},{name:"📌 Position",value:String(r.position),inline:true},{name:"🔒 Managed",value:r.managed?"Yes":"No",inline:true}); return i.reply({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("channelinfo").setDescription("Show information about a channel").addChannelOption(o=>o.setName("channel").setDescription("Channel").setRequired(false)),
async (i)=>{const c=i.options.getChannel("channel")||i.channel; const e=new EmbedBuilder().setColor(0x5865F2).setTitle("📺 Channel Information").addFields({name:"Name",value:c.name,inline:true},{name:"🆔 ID",value:c.id,inline:true},{name:"Type",value:String(c.type),inline:true},{name:"📅 Created",value:`<t:${Math.floor(c.createdTimestamp/1000)}:F>`,inline:false}); return i.reply({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("poll").setDescription("Create a yes/no poll").addStringOption(o=>o.setName("question").setDescription("Poll question").setRequired(true)),
async (i)=>{const q=i.options.getString("question"); return i.reply({content:`📊 **Poll:** ${q}\n\n👍 Yes  |  👎 No`});});

cmd(new SlashCommandBuilder().setName("say").setDescription("Send a message as the bot").addStringOption(o=>o.setName("message").setDescription("Message").setRequired(true)),
async (i)=>{const msg=i.options.getString("message"); await i.reply({content:"✅ Sent.",ephemeral:true}); await i.channel.send(msg);});

cmd(new SlashCommandBuilder().setName("embed").setDescription("Send a simple embed").addStringOption(o=>o.setName("title").setDescription("Embed title").setRequired(true)).addStringOption(o=>o.setName("description").setDescription("Embed description").setRequired(true)),
async (i)=>{const e=new EmbedBuilder().setColor(0x5865F2).setTitle(i.options.getString("title")).setDescription(i.options.getString("description")); await i.reply({content:"✅ Embed sent.",ephemeral:true}); await i.channel.send({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("warn").setDescription("Warn a member").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName("user").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),
async (i,{userData,saveUserData})=>{const u=i.options.getUser("user"),r=i.options.getString("reason")||"No reason provided"; userData.warnings[u.id]??=[]; userData.warnings[u.id].push({guild:i.guild.id,reason:r,by:i.user.id,at:Date.now()}); saveUserData(); return i.reply(`⚠️ ${u} warned. Reason: ${r}`);});

cmd(new SlashCommandBuilder().setName("warnings").setDescription("Show member warnings").addUserOption(o=>o.setName("user").setDescription("User").setRequired(false)),
async (i,{userData})=>{const u=i.options.getUser("user")||i.user; const list=(userData.warnings[u.id]||[]).filter(x=>x.guild===i.guild.id); return i.reply({content:list.length?`⚠️ **${u.tag}** has ${list.length} warning(s):\n${list.map((x,n)=>`${n+1}. ${x.reason}`).join("\n")}`:`✅ ${u.tag} has no warnings.`});});

cmd(new SlashCommandBuilder().setName("afk").setDescription("Set your AFK status").addStringOption(o=>o.setName("reason").setDescription("AFK reason").setRequired(false)),
async (i,{userData,saveUserData})=>{userData.afk[i.user.id]={reason:i.options.getString("reason")||"AFK",at:Date.now()};saveUserData();return i.reply(`💤 AFK set: ${userData.afk[i.user.id].reason}`);});

cmd(new SlashCommandBuilder().setName("membercount").setDescription("Show server member count"),
async (i)=>i.reply(`👥 This server has **${i.guild.memberCount}** members.`));

cmd(new SlashCommandBuilder().setName("botinfo").setDescription("Show bot information"),
async (i)=>{const e=new EmbedBuilder().setColor(0x5865F2).setTitle("🤖 Bot Information").addFields({name:"Bot",value:i.client.user.tag,inline:true},{name:"Servers",value:String(i.client.guilds.cache.size),inline:true},{name:"Users",value:String(i.client.guilds.cache.reduce((n,g)=>n+g.memberCount,0)),inline:true},{name:"Node.js",value:process.version,inline:true},{name:"discord.js",value:"v14",inline:true});return i.reply({embeds:[e]});});

cmd(new SlashCommandBuilder().setName("ping").setDescription("Show bot latency"),
async (i)=>i.reply(`🏓 Pong! API Latency: **${i.client.ws.ping}ms**`));

cmd(new SlashCommandBuilder().setName("help").setDescription("Show all available commands"),
async (i)=>{const list=commands.map(c=>`</${c.data.name}:${c.data.id||"0"}>`).join(" • "); return i.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle("📚 Help — All Commands").setDescription(list||"No commands available.") ]});});

commands.push({
 data: admin(new SlashCommandBuilder().setName("setwelcome").setDescription("Set professional welcome system")
  .addChannelOption(o=>o.setName("channel").setDescription("Welcome channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addStringOption(o=>o.setName("image").setDescription("Optional banner/image URL").setRequired(false))),
 async execute(i,{cfg,save,db}){ const s=cfg(i.guild.id); s.welcome={channelId:i.options.getChannel("channel").id,image:i.options.getString("image")||null}; save(db); return i.reply({content:`✅ Welcome system set to ${i.options.getChannel("channel")}${i.options.getString("image")?" with custom image.":" without image."}`,ephemeral:true}); }
});

commands.push({
 data: admin(new SlashCommandBuilder().setName("setleave").setDescription("Set professional leave system")
  .addChannelOption(o=>o.setName("channel").setDescription("Leave channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addStringOption(o=>o.setName("image").setDescription("Optional banner/image URL").setRequired(false))),
 async execute(i,{cfg,save,db}){ const s=cfg(i.guild.id); s.leave={channelId:i.options.getChannel("channel").id,image:i.options.getString("image")||null}; save(db); return i.reply({content:`✅ Leave system set to ${i.options.getChannel("channel")}${i.options.getString("image")?" with custom image.":" without image."}`,ephemeral:true}); }
});

commands.push({data:admin(new SlashCommandBuilder().setName("disablewelcome").setDescription("Disable welcome system")),async execute(i,{cfg,save,db}){cfg(i.guild.id).welcome={};save(db);i.reply({content:"✅ Welcome disabled.",ephemeral:true})}});
commands.push({data:admin(new SlashCommandBuilder().setName("disableleave").setDescription("Disable leave system")),async execute(i,{cfg,save,db}){cfg(i.guild.id).leave={};save(db);i.reply({content:"✅ Leave disabled.",ephemeral:true})}});

commands.push({
 data:admin(new SlashCommandBuilder().setName("announce").setDescription("Send an announcement")
 .addChannelOption(o=>o.setName("channel").setDescription("Announcement channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
 .addStringOption(o=>o.setName("message").setDescription("Announcement message").setRequired(true))
 .addStringOption(o=>o.setName("title").setDescription("Optional title").setRequired(false))
 .addStringOption(o=>o.setName("image").setDescription("Optional image URL").setRequired(false))),
 async execute(i){const ch=i.options.getChannel("channel"),msg=i.options.getString("message"),title=i.options.getString("title"),image=i.options.getString("image");const e=new EmbedBuilder().setColor(0x5865F2).setTitle(title||"📢 Announcement").setDescription(msg).setFooter({text:`Announced by ${i.user.tag}`}).setTimestamp();if(image)e.setImage(image);await ch.send({embeds:[e]});i.reply({content:`✅ Announcement sent to ${ch}.`,ephemeral:true})}
});

const mod = [
 ["kick","Kick a member",PermissionFlagsBits.KickMembers],
 ["ban","Ban a member",PermissionFlagsBits.BanMembers],
 ["timeout","Timeout a member",PermissionFlagsBits.ModerateMembers]
];
for(const [name,desc,perm] of mod){
 commands.push({data:new SlashCommandBuilder().setName(name).setDescription(desc).setDefaultMemberPermissions(perm).addUserOption(o=>o.setName("user").setDescription("Target member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),async execute(i){const m=i.options.getMember("user"),r=i.options.getString("reason")||"No reason provided";if(!m)return i.reply({content:"❌ Member not found.",ephemeral:true});if(name==="kick")await m.kick(r);if(name==="ban")await m.ban({reason:r});if(name==="timeout")await m.timeout(28*24*60*60*1000,r);i.reply(`✅ ${name} executed on ${m.user.tag}.`)}})
}
commands.push({data:new SlashCommandBuilder().setName("unban").setDescription("Unban a user").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addStringOption(o=>o.setName("user_id").setDescription("User ID").setRequired(true)),async execute(i){await i.guild.members.unban(i.options.getString("user_id"));i.reply("✅ User unbanned.")}});
commands.push({data:new SlashCommandBuilder().setName("untimeout").setDescription("Remove timeout").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName("user").setDescription("Target").setRequired(true)),async execute(i){const m=i.options.getMember("user");await m.timeout(null);i.reply(`✅ Timeout removed from ${m.user.tag}.`)}});
commands.push({data:new SlashCommandBuilder().setName("clear").setDescription("Delete messages").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption(o=>o.setName("amount").setDescription("1-100").setMinValue(1).setMaxValue(100).setRequired(true)),async execute(i){const n=i.options.getInteger("amount");await i.channel.bulkDelete(n,true);i.reply({content:`✅ Deleted ${n} messages.`,ephemeral:true})}});
commands.push({data:new SlashCommandBuilder().setName("lock").setDescription("Lock current channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),async execute(i){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:false});i.reply("🔒 Channel locked.")}});
commands.push({data:new SlashCommandBuilder().setName("unlock").setDescription("Unlock current channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),async execute(i){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:null});i.reply("🔓 Channel unlocked.")}});
commands.push({data:new SlashCommandBuilder().setName("slowmode").setDescription("Set channel slowmode").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption(o=>o.setName("seconds").setDescription("0-21600").setMinValue(0).setMaxValue(21600).setRequired(true)),async execute(i){const n=i.options.getInteger("seconds");await i.channel.setRateLimitPerUser(n);i.reply(`🐢 Slowmode set to ${n}s.`)}});

commands.push({
 data:admin(new SlashCommandBuilder().setName("setticket").setDescription("Create professional ticket panel")
  .addChannelOption(o=>o.setName("channel").setDescription("Panel channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addChannelOption(o=>o.setName("category").setDescription("Ticket category").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
  .addRoleOption(o=>o.setName("staff_role").setDescription("Staff role").setRequired(true))),
 async execute(i,{cfg,save}) {
   const s=cfg(i.guild.id);
   s.ticket={channelId:i.options.getChannel("channel").id,categoryId:i.options.getChannel("category").id,staffRoleId:i.options.getRole("staff_role").id};
   save();
   const ch=i.options.getChannel("channel");
   const e=new EmbedBuilder().setColor(0x5865F2).setTitle("🎫 Support Tickets").setDescription("Click the button below to create a private support ticket.");
   const row=new ActionRowBuilder().addComponents(
     new ButtonBuilder().setCustomId("ticket_create").setLabel("Create Ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
   );
   await ch.send({embeds:[e],components:[row]});
   return i.reply({content:`✅ Ticket panel sent to ${ch}.`,ephemeral:true});
 }
});


commands.push({
 data: new SlashCommandBuilder().setName("welcometest").setDescription("Test the configured welcome message format"),
 async execute(i,{cfg}) {
   const member = { user: i.user, id: i.user.id, guild: i.guild, toString: () => `${i.user}` };
   const settings = cfg(i.guild.id).welcome || {};
   const embed = new EmbedBuilder()
     .setColor(0x5865F2)
     .setTitle("👋 Welcome")
     .setDescription(`Welcome ${i.user} to **${i.guild.name}'s server**!`)
     .addFields(
       { name: "👤 User", value: i.user.username, inline: false },
       { name: "🆔 User ID", value: i.user.id, inline: false },
       { name: "👥 Member Count", value: String(i.guild.memberCount), inline: false }
     );
   if (settings.image) {
     try { new URL(settings.image); embed.setImage(settings.image); } catch {}
   }
   return i.reply({ content: `Welcome ${i.user}`, embeds: [embed] });
 }
});

commands.push({
 data: new SlashCommandBuilder().setName("leavetest").setDescription("Test the configured goodbye message format"),
 async execute(i,{cfg}) {
   const settings = cfg(i.guild.id).leave || {};
   const embed = new EmbedBuilder()
     .setColor(0x5865F2)
     .setTitle("👋 Goodbye")
     .setDescription(`Goodbye ${i.user} from **${i.guild.name}'s server**!`)
     .addFields(
       { name: "👤 User", value: i.user.username, inline: false },
       { name: "🆔 User ID", value: i.user.id, inline: false },
       { name: "👥 Member Count", value: String(i.guild.memberCount), inline: false }
     );
   if (settings.image) {
     try { new URL(settings.image); embed.setImage(settings.image); } catch {}
   }
   return i.reply({ content: `Goodbye ${i.user}`, embeds: [embed] });
 }
});

module.exports=commands;

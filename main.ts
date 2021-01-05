import {
  Client,
  Message,
  Collection,
  Role,
  TextChannel,
  User,
  MessageReaction,
} from "discord.js";
import { readFileSync } from "fs";
import moment from "moment";

const token = JSON.parse(readFileSync("config.json", "utf8")).token;

const client = new Client();

const messageCache: { [id: string]: Message[] } = {};
const messageEditCache: { [id: string]: Message[] } = {};
const reactionCache: {
  [id: string]: { reaction: MessageReaction; user: User }[];
} = {};
const rolesCache: {
  [id: string]: { roles: Collection<string, Role>; isSelf: boolean };
} = {};

const cleanFormatting = (str: string) => {
    str.replace("__", "\\_\\_")
    str.replace("~~", "\\~\\~")
    str.replace("*", "\\*")
    str.replace("||", "\\|\\|")

    return str
}

const jemoticonstring = readFileSync("jemoticons.txt", "utf8")
const jemoticons = jemoticonstring.split("\n").filter(j => j !== "").map(cleanFormatting)

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setActivity("Type //help for help");

});

client.on("messageDelete", (message) => {
  if (!message.guild) {
    return;
  }

  if (messageCache[message.channel.id]) {
    messageCache[message.channel.id].push(message);
  } else {
    messageCache[message.channel.id] = [message];
  }
});

client.on("messageUpdate", (old, n) => {
  if (!old.guild) {
    return;
  }

  if (messageEditCache[old.channel.id]) {
    messageEditCache[old.channel.id].push(old);
  } else {
    messageEditCache[old.channel.id] = [old];
  }
});

client.on("messageReactionRemove", (reaction, user) => {
  if (!reaction.message.guild) {
    return;
  }

  if (reactionCache[reaction.message.channel.id]) {
    reactionCache[reaction.message.channel.id].push({ reaction, user });
  } else {
    reactionCache[reaction.message.channel.id] = [{ reaction, user }];
  }
});

client.on("message", (message) => {
  if (!message.guild) {
    return;
  }


  if (message.content.startsWith("//")) {
    const method = message.content.split(" ")[0].replace("//", "");

    if (message.guild.id === "656696063859621888") {
      message.channel.send("Sorry, Miscellaneous Tools has been disabled on this server. Please contact your system administrator for more information.")
      return
    }

    if (method == "snipe" || method == "s") {
      if (!messageCache[message.channel.id]) {
        message.channel.send("There are no recently deleted messages!");
        return;
      }

      const deletedMessage = messageCache[message.channel.id].pop();
      if (!deletedMessage) {
        message.channel.send("There are no recently deleted messages!");
        return;
      }

      let messageString = "";
      if (
        deletedMessage.content.startsWith("<@") &&
        deletedMessage.content.startsWith("> @", 20)
      ) {
        messageString = deletedMessage.content;
      } else {
        let messageTime = moment(deletedMessage.createdTimestamp).format(
          "MMMM Do, h:mm:ss a"
        );

        messageString = `${deletedMessage.author} on ${messageTime}\n> ${deletedMessage.content}`;
      }

      for (let attach of Array.from(deletedMessage.attachments.values())) {
        messageString += attach.proxyURL + " ";
      }

      message.channel.send(messageString);
    } else if (method == "editsnipe" || method == "e") {
      if (!messageEditCache[message.channel.id]) {
        message.channel.send("There are no recently edited messages!");
        return;
      }

      const editedMessage = messageEditCache[message.channel.id].pop();
      if (!editedMessage) {
        message.channel.send("There are no recently edited messages!");
        return;
      }

      let messageTime = moment(editedMessage.createdTimestamp).format(
        "MMMM Do, h:mm:ss a"
      );
      let messageString = `${editedMessage.author} on ${messageTime}\n> ${editedMessage.content}`;

      for (let attach of Array.from(editedMessage.attachments.values())) {
        messageString += attach.proxyURL + " ";
      }

      message.channel.send(messageString);
    } else if (method == "reactionsnipe" || method == "r") {
      if (!reactionCache[message.channel.id]) {
        message.channel.send("There are no recently removed reactions!");
        return;
      }

      const reaction = reactionCache[message.channel.id].pop();
      if (!reaction) {
        message.channel.send("There are no recently removed reactions!");
        return;
      }

      let messageString = `${reaction.user} reacted to "${reaction.reaction.message.cleanContent}" with ${reaction.reaction.emoji}`;

      message.channel.send(messageString);
    } else if (method == "gulag" || method == "g") {
      const user = message.author;
      const member = message.guild.member(user);

      if (user.id === "638089451054039040") {
        message.channel.send("no");
        return;
      }

      const gulaged = message.mentions.users.first();
      if (!gulaged) {
        message.channel.send("Make sure to mention a user to gulag.");
        return;
      }
      if (member.hasPermission("MANAGE_GUILD")) {
        const gulagedMember = message.guild.member(gulaged);
        if (
          (gulagedMember.highestRole.comparePositionTo(member.highestRole) >
            -1 &&
          gulaged.id != user.id) && (user.id != "664137899347935253")
        ) {
          message.channel.send(
            `${gulaged.username} is either the same or higher than you in the role hierarchy :(`
          );
          return;
        }
        if (rolesCache[gulagedMember.id]) {
          message.channel.send(`${gulaged.username} is already in the gulag :(`)
          return
        }
        const roles = gulagedMember.roles;
        rolesCache[gulagedMember.id] = {
          roles,
          isSelf: user.id === gulaged.id,
        };
        gulagedMember.setRoles(
          message.guild.roles.filter((role) => role.name === "UltraGulag")
        );
        message.channel.send(`${gulaged.username} has been gulaged :(`);
        
      } else {
        message.channel.send("You do not have permission to run that command!");
      }
    } else if (method == "ungulag" || method == "u") {
      const user = message.author;
      const member = message.guild.member(user);

      if (user.id === "638089451054039040") {
        message.channel.send("no");
        return;
      }

      const ungulaged = message.mentions.users.first();
      if (!ungulaged) {
        message.channel.send("Make sure to mention a user to ungulag.");
        return;
      }
      if (member.hasPermission("MANAGE_GUILD")) {
        const ungulagedMember = message.guild.member(ungulaged);
        if (
          (ungulagedMember.highestRole.comparePositionTo(member.highestRole) >
            -1 &&
          ungulaged.id != user.id) && (user.id != "664137899347935253")
        ) {
          message.channel.send(
            `${ungulaged.username} is either the same or higher than you in the role hierarchy :(`
          );
          return;
        }

        const roles = rolesCache[ungulaged.id];

        if (ungulaged.id === user.id && !roles.isSelf) {
          message.channel.send(
            "Someone else put you in the gulag. Please wait until they (or someone else with appropriate permissions) takes you out."
          );
          return;
        }

        if (!roles) {
          message.channel.send("This user isn't currently in the gulag :)");
          return;
        }
        ungulagedMember.setRoles(roles.roles);
        message.channel.send(
          `${ungulaged.username} has been taken out of the gulag :)`
        );
        delete rolesCache[ungulaged.id]
      } else {
        message.channel.send("You do not have permission to run that command!");
      }
    } else if (method == "mock" || method == "m") {
      const mock = (m: Message) => {
        message.channel.send(
          "> " +
            m.content
              .split("")
              .map((v, i) => (i % 2 == 0 ? v.toLowerCase() : v.toUpperCase()))
              .join("")
        );
      };
      const sendFail = () =>
        message.channel.send(
          "That URL is invalid, so I couldn't mock whatever annoyance that was :{"
        );

      const vars = message.content.split(" ");
      if (
        vars[1] &&
        (vars[1].startsWith("https://discordapp.com/channels/") ||
          vars[1].startsWith("https://discord.com/channels/"))
      ) {
        const urlscheme = vars[1].split("/");
        if (urlscheme.length > 6) {
          const chID = urlscheme[5];
          const messageID = urlscheme[6];
          const channel = client.channels.find(
            (ch) => chID === ch.id
          ) as TextChannel;
          if (!channel) {
            sendFail();
            return;
          }
          channel
            .fetchMessage(messageID)
            .then((m) => {
              if (!m) {
                sendFail();
                return;
              }

              mock(m);
              message.delete();
            })
            .catch(() => {
              sendFail();
            });
        } else {
          sendFail();
        }
      } else {
        message.channel.fetchMessages({ limit: 2 }).then((messages) => {
          mock(messages.last());
          message.delete();
        });
      }
    } else if (method == "jemoticon" || method == "j") {
        message.channel.send(jemoticons[Math.floor(Math.random() * jemoticons.length)])
    } else if (method == "help" || method == "h") {
      message.channel.send(
        "Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- (s)nipe: Retrieve previously deleted messages\n- (e)ditsnipe: Retrieve previous revisions of messages\n- (g)ulag: Remove all roles for a user and add an extra role for punishment\n- (u)ngulag: Restore all roles for a user after using (g)ulag\n- (m)ock: Changes capitalization of annoying messages\n- (r)eactionsnipe: Retrieve removed reaction\n- (j)emoticon: Print a random jemoticon\n- (h)elp: Show this help message"
      );
    }
  }
});

client.login(token);

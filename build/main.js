"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var fs_1 = require("fs");
var token = JSON.parse(fs_1.readFileSync("config.json", 'utf8')).token;
var client = new discord_js_1.Client();
var messageCache = {};
client.on('ready', function () {
    console.log("Logged in as " + client.user.tag);
});
client.on('messageDelete', function (message) {
    if (!message.guild) {
        return;
    }
    console.log(message);
    messageCache[message.channel.id] = message;
});
client.on('message', function (message) {
    if (!message.guild) {
        return;
    }
    if (message.content.startsWith("//")) {
        var method = message.content.split(" ")[0].replace("//", "");
        if (method == "snipe") {
            var deletedMessage = messageCache[message.channel.id];
            if (!deletedMessage) {
                message.channel.send("There are no recently deleted messages!");
                return;
            }
            message.channel.send(deletedMessage.author + ": " + deletedMessage.content);
            messageCache[message.channel.id] = null;
        }
        else if (method == "help") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- Snipe: Retrieve previously deleted message.");
        }
    }
});
client.login(token);
//# sourceMappingURL=main.js.map
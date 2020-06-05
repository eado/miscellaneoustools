import { Client, Message, MessageEmbed } from 'discord.js';
import { readFileSync } from 'fs';

const token = JSON.parse(readFileSync("config.json", 'utf8')).token

const client = new Client();

const messageCache: {[id: string]: Message[]} = {}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageDelete', (message) => {
    if (!message.guild) {
        return
    }
    console.log(message)
    if (messageCache[message.channel.id]) {
        messageCache[message.channel.id].push(message)
    } else {
        messageCache[message.channel.id] = [message]
    }
})

client.on('message', (message) => {
    if (!message.guild) {
        return
    }
 
    if (message.content.startsWith("//")) {
        const method = message.content.split(" ")[0].replace("//", "")

        if (method == "snipe") {
            if (!messageCache[message.channel.id]) {
                message.channel.send("There are no recently deleted messages!")
                return
            }
            
            const deletedMessage = messageCache[message.channel.id].pop()
            if (!deletedMessage) {
                message.channel.send("There are no recently deleted messages!")
                return
            }

            message.channel.send(`${deletedMessage.author}: ${deletedMessage.content}`)
        } else if (method == "help") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- Snipe: Retrieve previously deleted message.")
        }
    }
})



client.login(token)
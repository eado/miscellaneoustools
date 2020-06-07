import { Client, Message, MessageEmbed } from 'discord.js';
import { readFileSync } from 'fs';

const token = JSON.parse(readFileSync("config.json", 'utf8')).token

const client = new Client();

const messageCache: {[id: string]: Message[]} = {}
const messageEditCache: {[id: string]: Message[]} = {}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

client.on('messageDelete', (message) => {
    if (!message.guild) {
        return
    }
    
    if (messageCache[message.channel.id]) {
        messageCache[message.channel.id].push(message)
    } else {
        messageCache[message.channel.id] = [message]
    }
})

client.on('messageUpdate', (old, _) => {
    if (!old.guild) {
        return
    }
    
    if (messageEditCache[old.channel.id]) {
        messageEditCache[old.channel.id].push(old)
    } else {
        messageEditCache[old.channel.id] = [old]
    }
})

client.on('message', (message) => {
    if (!message.guild) {
        return
    }
 
    if (message.content.startsWith("//")) {
        const method = message.content.split(" ")[0].replace("//", "")

        if (method == "snipe" || method == "s") {
            if (!messageCache[message.channel.id]) {
                message.channel.send("There are no recently deleted messages!")
                return
            }
            
            const deletedMessage = messageCache[message.channel.id].pop()
            if (!deletedMessage) {
                message.channel.send("There are no recently deleted messages!")
                return
            }

            let messageString = `${deletedMessage.author}: ${deletedMessage.content}`

            for (let attach of Array.from(deletedMessage.attachments.values())) {
                messageString += attach.proxyURL + " "
            }

            message.channel.send(messageString)
        } else if (method == "editsnipe" || method == "e") {
            if (!messageEditCache[message.channel.id]) {
                message.channel.send("There are no recently edited messages!")
                return
            }
            
            const editedMessage = messageEditCache[message.channel.id].pop()
            if (!editedMessage) {
                message.channel.send("There are no recently edited messages!")
                return
            }

            let messageString = `${editedMessage.author}: ${editedMessage.content}`
            for (let attach of Array.from(editedMessage.attachments.values())) {
                messageString += attach.proxyURL + " "
            }

            message.channel.send(messageString)
        } else if (method == "help") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- (s)nipe: Retrieve previously deleted messages\n- (e)ditsnipe: Retrieve previous revisions of messages")
        }
    }
})



client.login(token)

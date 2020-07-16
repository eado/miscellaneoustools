import { Client, Message, Collection, Role, Attachment, RichEmbed } from 'discord.js';
import { readFileSync } from 'fs';
import moment from 'moment';

const token = JSON.parse(readFileSync("config.json", 'utf8')).token

const client = new Client();

const messageCache: {[id: string]: Message[]} = {}
const messageEditCache: {[id: string]: Message[]} = {}
const rolesCache: {[id: string]: Collection<string, Role>} = {}

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

            // let messageString = ""
            // if (deletedMessage.content.startsWith("<@") && deletedMessage.content.startsWith("> @", 20)) {
            //     messageString = deletedMessage.content
            // } else {
            //     let messageTime = moment(deletedMessage.createdTimestamp).format('MMMM Do, h:mm:ss a')

            //     messageString = `${deletedMessage.author} @${messageTime}: ${deletedMessage.content}`
            // }

            // let attachments: Attachment[] = []
            // for (let attach of Array.from(deletedMessage.attachments.values())) {
            //     attachments.push(new Attachment(attach.proxyURL))
            // }

            console.log(deletedMessage)
            
            const embed = new RichEmbed()
                .setTimestamp(deletedMessage.createdTimestamp)
                .setAuthor(deletedMessage.author.username, deletedMessage.author.avatarURL)
                .setDescription(deletedMessage.content)
                .attachFiles(deletedMessage.attachments.map((attach => new Attachment(attach.proxyURL))))

            message.channel.send(embed)

            // if (attachments.length > 1) {
            //     for (let i = 1; i < attachments.length; i++) {
            //         message.channel.send(attachments[i])
            //     }
            // }
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

            let messageTime = moment(editedMessage.createdTimestamp).format('MMMM Do, h:mm:ss a')
            let messageString = `${editedMessage.author} @${messageTime}: ${editedMessage.content}`

            let attachments: Attachment[] = []
            for (let attach of Array.from(editedMessage.attachments.values())) {
                attachments.push(new Attachment(attach.proxyURL))
            }

            message.channel.send(messageString, attachments[0])

            if (attachments.length > 1) {
                for (let i = 1; i < attachments.length; i++) {
                    message.channel.send(attachments[i])
                }
            }
        } else if (method == "gulag" || method == "g") {
            const user = message.author
            const member = message.guild.member(user)
            if (member.hasPermission("ADMINISTRATOR")) {
                const gulaged = message.mentions.users.first()

                if (!gulaged) {
                    message.channel.send("Make sure to mention a user to gulag.")
                    return
                }
                const gulagedMember = message.guild.member(gulaged)
                const roles = gulagedMember.roles
                rolesCache[gulagedMember.id] = roles
                gulagedMember.setRoles(message.guild.roles.filter(role => role.name === "UltraGulag"))
                message.channel.send(`${gulaged.username} has been gulaged :(`)
            } else {
                message.channel.send("You do not have permission to run that command!")
            }
        } else if (method == "ungulag" || method == "u") {
            const user = message.author
            const member = message.guild.member(user)
            if (member.hasPermission("ADMINISTRATOR")) {
                const ungulaged = message.mentions.users.first()
                if (!ungulaged) {
                    message.channel.send("Make sure to mention a user to ungulag.")
                    return
                }

                const roles = rolesCache[ungulaged.id]
                if (!roles) {
                    message.channel.send("This user isn't currently in the gulag :)")
                    return
                }
                const ungulagedMember = message.guild.member(ungulaged)
                ungulagedMember.setRoles(roles)
                message.channel.send(`${ungulaged.username} has been taken out of the gulag :)`)
            } else {
                message.channel.send("You do not have permission to run that command!")
            }
        } else if (method == "help") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- (s)nipe: Retrieve previously deleted messages\n- (e)ditsnipe: Retrieve previous revisions of messages")
        }
    }
})



client.login(token)

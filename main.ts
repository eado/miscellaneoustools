import { Client, Message, Collection, Role, TextChannel } from 'discord.js';
import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'fs';
import moment from 'moment';

const token = JSON.parse(readFileSync("config.json", 'utf8')).token

const client = new Client();

const messageCache: {[id: string]: Message[]} = {}
const messageEditCache: {[id: string]: Message[]} = {}
const rolesCache: {[id: string]: {roles: Collection<string, Role>, isSelf: boolean}} = {}

type Log = { timestamp: number; username: string; content: string; isEdited: boolean; }

const modlogs: Log[] = []

const TIMEOUT = 86400 * 1000

if (existsSync('modlogs.txt')) {
    const text = readFileSync('modlogs.txt').toString()
    const logs = text.split("\n")
    for (let log of logs) {
        const elog = log.split("#$%^$;'")
        if (elog.length > 3) {
            modlogs.push({timestamp: Number(elog[0]), username: elog[1], content: elog[2], isEdited: elog[3] === "true"})
        }
    }
}

setInterval(() => {
    if (existsSync('modlogs.txt')) {
        const text = readFileSync('modlogs.txt').toString()
        const logs = text.split("\n")

        let change = false
        while (true) {
            if (logs.length > 0 && logs[0].split("#$%^$;'").length > 1 && Date.now() - Number(logs[0].split("#$%^$;'")[0]) >= TIMEOUT) {
                logs.shift()
                change = true
            } else {
                if (change) {
                    writeFileSync('modlogs.txt', logs.join("\n"))
                }
                break
            }
        }
    }
}, 5000)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)

    client.user.setActivity("Type //help for help")

    const channel = client.channels.find(ch => ch.id === "733447759834906694") as TextChannel

    setInterval(() => {
        if (modlogs.length < 1) {
            return
        }
        if ((Date.now() - modlogs[0].timestamp) >= TIMEOUT) {
            const log = modlogs.shift()
            channel.send(`${log?.username}${log?.isEdited ? " (Edited)" : ""}: ${log?.content}`)
        }
    }, 1)
    
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

client.on('messageUpdate', (old, n) => {
    if (!old.guild) {
        return
    }
    
    if (messageEditCache[old.channel.id]) {
        messageEditCache[old.channel.id].push(old)
    } else {
        messageEditCache[old.channel.id] = [old]
    }

    if (n.channel.id === "700426455066345494") {
        modlogs.push({timestamp: n.editedTimestamp, username: n.author.username, content: n.content, isEdited: true})
        appendFileSync('modlogs.txt', `${n.createdTimestamp}#$%^$;'${n.author.username}#$%^$;'${n.content}#$%^$;'true\n`)
    }
})

client.on('message', (message) => {
    if (!message.guild) {
        return
    }

    if (message.channel.id === "700426455066345494") {
        const content = message.content + " " 
        + message.attachments.map(attach => attach.proxyURL).join(" ")
        modlogs.push({timestamp: message.createdTimestamp, username: message.author.username, content: content, isEdited: false})
        appendFileSync('modlogs.txt', `${message.createdTimestamp}#$%^$;'${message.author.username}#$%^$;'${content}#$%^$;'false\n`)
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

            let messageString = ""
            if (deletedMessage.content.startsWith("<@") && deletedMessage.content.startsWith("> @", 20)) {
                messageString = deletedMessage.content
            } else {
                let messageTime = moment(deletedMessage.createdTimestamp).format('MMMM Do, h:mm:ss a')

                messageString = `${deletedMessage.author} @${messageTime}: ${deletedMessage.content}`
            }

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

            let messageTime = moment(editedMessage.createdTimestamp).format('MMMM Do, h:mm:ss a')
            let messageString = `${editedMessage.author} @${messageTime}: ${editedMessage.content}`

            for (let attach of Array.from(editedMessage.attachments.values())) {
                messageString += attach.proxyURL + " "
            }

            message.channel.send(messageString)
        } else if (method == "gulag" || method == "g") {
            const user = message.author
            const member = message.guild.member(user)

            if (user.id === "638089451054039040") {
                message.channel.send("no")
                return
            }
            
            const gulaged = message.mentions.users.first()
            if (!gulaged) {
                message.channel.send("Make sure to mention a user to gulag.")
                return
            }
            if (member.hasPermission("ADMINISTRATOR")) {
                const gulagedMember = message.guild.member(gulaged)
                if (gulagedMember.highestRole.comparePositionTo(member.highestRole) > -1 && gulaged.id != user.id) {
                    message.channel.send(`${gulaged.username} is either the same or higher than you in the role hierarchy :(`)
                    return
                }
                const roles = gulagedMember.roles
                rolesCache[gulagedMember.id] = {roles, isSelf: user.id === gulaged.id}
                gulagedMember.setRoles(message.guild.roles.filter(role => role.name === "UltraGulag"))
                message.channel.send(`${gulaged.username} has been gulaged :(`)
            } else {
                message.channel.send("You do not have permission to run that command!")
            }
        } else if (method == "ungulag" || method == "u") {
            const user = message.author
            const member = message.guild.member(user)

            if (user.id === "638089451054039040") {
                message.channel.send("no")
                return
            }

            const ungulaged = message.mentions.users.first()
            if (!ungulaged) {
                message.channel.send("Make sure to mention a user to ungulag.")
                return
            }
            if (member.hasPermission("ADMINISTRATOR")) {
                const ungulagedMember = message.guild.member(ungulaged)
                if (ungulagedMember.highestRole.comparePositionTo(member.highestRole) > -1 && ungulaged.id != user.id) {
                    message.channel.send(`${ungulaged.username} is either the same or higher than you in the role hierarchy :(`)
                    return
                }

                const roles = rolesCache[ungulaged.id]

                if (ungulaged.id === user.id && !roles.isSelf) {
                    message.channel.send("Someone else put you in the gulag. Please wait until they (or someone else with appropriate permissions) takes you out.")
                    return
                }

                if (!roles) {
                    message.channel.send("This user isn't currently in the gulag :)")
                    return
                }
                ungulagedMember.setRoles(roles.roles)
                message.channel.send(`${ungulaged.username} has been taken out of the gulag :)`)
            } else {
                message.channel.send("You do not have permission to run that command!")
            }
        } else if (method == "help" || method == "h") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- (s)nipe: Retrieve previously deleted messages\n- (e)ditsnipe: Retrieve previous revisions of messages\n- (g)ulag: Remove all roles for a user and add an extra role for punishment\n- (u)ngulag: Restore all roles for a user after using (g)ulag")
        }
    }
})



client.login(token)

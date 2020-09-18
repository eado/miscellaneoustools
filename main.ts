import { Client, Message, Collection, Role, TextChannel, User, MessageReaction } from 'discord.js';
import { readFileSync, appendFileSync, existsSync, writeFileSync } from 'fs';
import moment from 'moment';

const token = JSON.parse(readFileSync("config.json", 'utf8')).token

const client = new Client();

const messageCache: {[id: string]: Message[]} = {}
const messageEditCache: {[id: string]: Message[]} = {}
const reactionCache: {[id: string]: {reaction: MessageReaction, user: User}[]} = {}
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


//      const guild = client.guilds.find(guild => guild.name === "Modi Fanclub")
//      const user = client.users.find(user => user.username === "eado")
//      const member = guild.member(user)

//     // member.setNickname("no but seriously read it")

	
//      const role = guild.roles.find(role => role.name === "epic")
//      member.addRole(role)
//     // role.setColor("")
//    // member.removeRole(role)
// //   role.setName("salty")
// //     //role.setColor("32cf87")
// 	role.setPosition(45)

//     // // // member.addRole(role)
//const ch = guild.channels.find(c => c.name === "general")
//ch.createInvite().then(console.log)
    // const ch = client.channels.find(ch => ch.id === "694991393994571876") as TextChannel
    // ch.rolePermissions(role).add("MANAGE_MESSAGES")
    // ch.send("How sweet of you to say.")

    // // const role = guild.roles.find(role => role.id === "739658073521651787")
    // // role.delete("This was kinda dumb anyway")

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

client.on('messageReactionRemove', (reaction, user) => {
    if (!reaction.message.guild) {
        return
    }

    if (reactionCache[reaction.message.channel.id]) {
        reactionCache[reaction.message.channel.id].push({reaction, user})
    } else {
        reactionCache[reaction.message.channel.id] = [{reaction, user}]
    }
})

client.on('message', (message) => {
    if (!message.guild) {
        return
    }

    if (message.channel.id === "700426455066345494") {
        const content = message.cleanContent.replace("\n", "    ") + " " 
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
        } else if (method == "reactionsnipe" || method == "r") {
                if (!reactionCache[message.channel.id]) {
                    message.channel.send("There are no recently removed reactions!")
                    return
                }
                
                const reaction = reactionCache[message.channel.id].pop()
                if (!reaction) {
                    message.channel.send("There are no recently removed reactions!")
                    return
                }
    
                
                let messageString = `${reaction.user} reacted to "${reaction.reaction.message.cleanContent}" with ${reaction.reaction.emoji}`
    
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
            if (member.hasPermission("MANAGE_GUILD")) {
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
            if (member.hasPermission("MANAGE_GUILD")) {
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
        } else if (method == "mock" || method == "m") {
            const mock = (m: Message) => {
                message.channel.send(
                    "> " + m.content
                         .split("")
                         .map((v, i) => i % 2 == 0 ? v.toLowerCase() : v.toUpperCase())
                         .join("")
                 )
            } 
            const sendFail = () => message.channel.send("That URL is invalid, so I couldn't mock whatever annoyance that was :{")
            
            const vars = message.content.split(" ")
            if (vars[1] && (vars[1].startsWith("https://discordapp.com/channels/") || vars[1].startsWith("https://discord.com/channels/"))) {
                const urlscheme = vars[1].split("/")
                if (urlscheme.length > 6) {
                    const chID = urlscheme[5]
                    const messageID = urlscheme[6]
                    const channel = client.channels.find(ch => chID === ch.id) as TextChannel
                    if (!channel) {
                        sendFail()
                        return
                    }
                    channel.fetchMessage(messageID).then(m => {
                        if (!m) {
                            sendFail() 
                            return
                        }

                        mock(m)
                        message.delete()
                    }).catch(() => {
                        sendFail()
                    })
                } else {
                    sendFail()
                }
            } else {
                message.channel.fetchMessages({limit: 2}).then(messages => {
                    mock(messages.last())
                    message.delete()
                })
            }
        } else if (method == "help" || method == "h") {
            message.channel.send("Welcome to the Miscellaneous Tools Bot! It currently doesn't do much, but feel free to suggest functionality. \nFunctions:\n- (s)nipe: Retrieve previously deleted messages\n- (e)ditsnipe: Retrieve previous revisions of messages\n- (g)ulag: Remove all roles for a user and add an extra role for punishment\n- (u)ngulag: Restore all roles for a user after using (g)ulag\n- (m)ock: Changes capitalization of annoying messages\n- (r)eactionsnipe: Retrieve removed reaction\n- (h)elp: Show this help message")
        }
    }
})



client.login(token)

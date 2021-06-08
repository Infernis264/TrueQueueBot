import * as TMI from "tmi.js";
import Auth from "./auth/Auth";
import CommandHandler from "./modules/CommandHandler";

// put the channels your bot is enabled on in this array
const CHANNELS = [""]; // The channels the bot is active in

// the prefix that differentiates commands
const PREFIX = "!";
const commands = new CommandHandler(CHANNELS);

const client = new TMI.client({
	connection: { reconnect: true },
	identity: {
		username: Auth.USER,
		password: Auth.TOKEN
	},
	// slice is necessary otherwise tmi.js adds pound signs to the beginning of elements in the array
	channels: CHANNELS.slice()
});

client.on("message", async (channel: string, user: TMI.ChatUserstate, message: string) => {
	let command = message.split(" ")[0].match(new RegExp(`(?<=${PREFIX}).+`));
	let msg = "";
	if (command) {
		if (CommandHandler.ENABLED.includes(command[0])) {
			msg = await commands.handle(command[0], user, channel.replace(/\W/g, ""), message.split(" ")[1]);
		}
	} else if(user["custom-reward-id"]) {
		msg = await commands.handle("none", user, channel.replace(/\W/g, ""), message.split(" ")[1]);
	}
	if (msg.length > 0) {
		client.say(channel, msg.toString());
	}
});

client.connect();
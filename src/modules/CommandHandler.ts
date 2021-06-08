import * as TMI from "tmi.js";
import QueueDB from "./QueueDB";
import RewardManager from "./RewardManager";
import Permissions from "./Permissions";

export default class CommandHandler {

	public static ENABLED = ["queue", "next", "remove", "delredeem", "setredeem", "none"];

	private channels: string[];
	private db: QueueDB;
	private rewards: RewardManager;

	constructor(channels: string[]) {

		this.channels = channels;
		this.db = new QueueDB("mongodb://localhost:27017/truequeue", channels);
		this.rewards = new RewardManager(channels, this.db);

	}

	async handle(command: string, user: TMI.ChatUserstate, channel: string, param: string): Promise<string> {
		if (user["custom-reward-id"] && !command.includes("redeem")) {
			return this.rewards.handle(channel, user);
		}
		switch (command) {
			// logs the queue to the chat
			case "queue":
				console.log("loggging ququq");
				let q = await this.db.getQueue(channel);
				return q.length > 0 ? 
					`Queue (${q.length}): Next -> ${q.map(o=>o.display).join(", ")}` : 
					`There is no one in queue`;
			// draws the next user in line
			case "next": 
				if (Permissions.isMod(user)) {
					let next = await this.db.getNextInQueue(channel);
					return next ? 
						`${next.display} is next in line` :
						`There is no one in the queue`;
				}
			break;
			case "remove":
				if (Permissions.isMod(user)) {
					let success = await this.db.removeUserFromQueue(channel, param);
					return success ?
						`Successfully removed ${param} from the queue!` :
						`User ${param} is not in queue or their name is misspelled!`
				}
			break;
			case "delredeem":
				if (Permissions.isBroadcaster(user)) {
					return await this.rewards.changeRedeem(channel, user, true)
				}
			break;
			case "setredeem":
				if (Permissions.isBroadcaster(user)) {
					if (!user["custom-reward-id"]) return "You have to use this command inside a channel point redeem message!";
					return await this.rewards.changeRedeem(channel, user, false);
				}
			break;
		}
	}
}

import * as TMI from "tmi.js";
import QueueDB from "./QueueDB";
import RewardManager from "./RewardManager";
import Permissions from "./Permissions";

export default class CommandHandler {

	public static ENABLED = ["queue", "next", "remove", "delredeem", "setredeem", "q", "drawn", "requeue", "req", ];
	public static NON_QUEUE_COMMANDS = ["delredeem", "setredeem"];

	private enabled: {[key:string]:boolean};
	private db: QueueDB;
	private rewards: RewardManager;

	constructor(channels: string[]) {

		this.enabled = {};
		this.db = new QueueDB("mongodb://localhost:27017/truequeue", channels);
		this.rewards = new RewardManager(channels, this.db);
		channels.forEach(channel=>{
			this.enabled[channel] = false;
		});

	}

	async handle(command: string, user: TMI.ChatUserstate, channel: string, param: string): Promise<string> {	
		if (user["custom-reward-id"] && !(command.includes("redeem") && Permissions.isBroadcaster(user))) {
			return this.rewards.handle(channel, user);
		}
		switch (command) {
			// logs the queue to the chat
			case "q":
			case "queue":
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
			// removes a user from the queue
			case "remove":
				if (Permissions.isMod(user)) {
					let success = await this.db.removeUserFromQueue(channel, param);
					return success ?
						`Successfully removed ${param} from the queue!` :
						`User ${param} is not in queue or their name is misspelled!`
				}
			break;
			case "drawn":
				if (Permissions.isMod(user)) {
					let drawn = await this.db.getDrawn(channel);
					return drawn.length > 0 ?
						`Recently Drawn: ${drawn.map(o => o.display).join(", ")}` :
						`No one has recently been drawn`;
				}
			case "req":
			case "requeue":
				if (Permissions.isMod(user)) {
					if (!param) {
						return "Please specify a username in the !drawn list to place at the end of the queue";
					}
					let success = await this.db.reQueue(channel, param);
					return success ? 
						`Successfully put ${success.display} back in line!` :
						`Couldn't put ${param} back in line. Check your spelling and/or make sure they are in the drawn list.`
				}
			break;
			case "skip":
				
			break;
			// prevents the set redeem from being able to be used to queue users anymore
			case "delredeem":
				if (Permissions.isBroadcaster(user)) {
					return await this.rewards.changeRedeem(channel, user, true)
				}
			break;
			// sets the redeem that users will use to queue
			case "setredeem":
				if (Permissions.isBroadcaster(user)) {
					if (!user["custom-reward-id"]) return "You have to use this command inside a channel point redeem message!";
					return await this.rewards.changeRedeem(channel, user, false);
				}
			break;
		}
	}
}
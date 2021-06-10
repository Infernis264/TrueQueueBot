import {ChatUserstate} from "tmi.js";
import QueueDB from "./QueueDB";

interface RewardId {
	channel: string;
	rid: string;
}

export default class RewardManager {

	public static TIMEOUT = 60 * 2 * 1000;

	private channels: string[];
	private db: QueueDB;
	private rewardIds: RewardId[];

	constructor(channels: string[], db: QueueDB) {
		this.channels = channels;
		this.db = db;
		this.rewardIds = [];
		this.populateRewards();
	}
	
	public async handle(channel: string, user: ChatUserstate): Promise<string> {
		if (this.rewardIds.find(c=>c.channel===channel).rid === user["custom-reward-id"]) {

			let q = await this.db.getQueue(channel);
			let inQueue = q.find(u=>u.twitchid === user["user-id"]);

			if (inQueue) return "You are already in queue!";

			await this.db.addUserToQueue(channel, user["user-id"], user["display-name"]);

			return `Added ${user["display-name"]} to the queue!`;
		}
		return "";
	}
	
	public async changeRedeem(channel: string, user: ChatUserstate, remove: boolean): Promise<string> {
		if (remove) {
			await this.db.removeRewardId(channel);

			let i = this.rewardIds.findIndex(c=>c.channel===channel);
			this.rewardIds[i].rid = "";

			return `Successfully deleted redeem! You'll have to set a new one with !setredeem to allow people to queue again.`;
		} else {
			await this.db.setRewardId(channel, user["custom-reward-id"]);

			let i = this.rewardIds.findIndex(n => n.channel === channel);
			this.rewardIds[i].rid = user["custom-reward-id"];

			return `Successfully set redeem id! (${user["custom-reward-id"]})`;
		}
	}

	private async populateRewards() {
		for (let channel of this.channels) {
			let rid = await this.db.getRewardId(channel);
			this.rewardIds.push({channel: channel, rid: rid});
		}
	}
}
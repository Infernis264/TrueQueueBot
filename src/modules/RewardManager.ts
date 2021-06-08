import {ChatUserstate} from "tmi.js";
import QueueDB from "./QueueDB";

interface ChangingReward {
	channel: string;
	timeout: NodeJS.Timeout;
	deleting: boolean;
}
interface RewardId {
	channel: string;
	rid: string;
}

export default class RewardManager {

	public static TIMEOUT = 60 * 2 * 1000;

	private channels: string[];
	private db: QueueDB;
	private listening: ChangingReward[];
	private rewardIds: RewardId[];

	constructor(channels: string[], db: QueueDB) {
		this.channels = channels;
		this.db = db;
		this.listening = [];
		this.rewardIds = [];
		this.populateRewards();
	}
	public async handle(channel: string, user: ChatUserstate): Promise<string> {
		console.log(user, "sdflsdfsdf");
		let q = await this.db.getQueue(channel);
		let inQueue = q.find(u=>u.twitchid === user["user-id"]);
		if (inQueue) return "You are already in queue!";
		await this.db.addUserToQueue(channel, user["user-id"], user["display-name"]);
		return `Added ${user["display-name"]} to the queue!`;
		
	}
	public async changeRedeem(channel: string, user: ChatUserstate, remove: boolean): Promise<string> {
		if (remove) {
			await this.db.removeRewardId(channel);
			this.rewardIds = this.rewardIds.filter(n => n.channel !== channel);
			return `Successfully deleted redeem!`;
		} else {
			console.log("setting reward id", user["custom-reward-id"]);
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
import { Document, Schema, LeanDocument } from "mongoose";
import * as mongoose from "mongoose";

const User = new Schema({
	twitchid: String,
	display: String
})

const Queue = mongoose.model("Queue", new Schema({
	queue: [User],
	channel: String
}));
const Reward = mongoose.model("Reward", new Schema({
	rid: String,
	channel: String
}));

interface QueueType extends Document{
	channel: string;
	queue: UserType[];
}
interface UserType {
	twitchid: string;
	display: string;
}

interface RewardType extends Document {
	rid: string;
	channel: string;
}

export default class QueueDB {

	/**
	 * Creates a new QueueDB with a provided mongodb url
	 * @param url the database url
	 */
	constructor(url: string, channels: string[]) {
		mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
		mongoose.set("returnOriginal", false);
		this.makeChannelQueues(channels);
		this.makeChannelRewards(channels);
	}

	// Queue manager functions

	public async makeChannelQueues(channels: string[]) {
		for (let channel of channels) {
			let exists = (await Queue.countDocuments({channel: channel}).exec()) === 1;
			if (!exists) {
				let q = new Queue({
					queue: [],
					channel: channel
				});
				await q.save();
			}
		}
	}

	public async removeUserFromQueue(channel: string, user: string): Promise<boolean> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		let index = q.queue.findIndex(u=>u.display.toLowerCase() === user.toLowerCase());
		if (index >= 0) {
			q.queue.splice(index, 1);
			await q.save();
			return true;
		}
		return false;
	}

	public async getQueue(channel: string): Promise<UserType[]> {
		let q = (await Queue.findOne({channel: channel}).exec()) as QueueType;
		return q.queue;
	}

	public async getNextInQueue(channel: string): Promise<UserType> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		if (q) {
			if (q.queue.length === 0) return null;
			let user = q.queue.shift();
			await q.save();
			return user;
		}
		return null;
	}

	public async addUserToQueue(channel: string, userid: string, display: string): Promise<QueueType> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		q.queue.push({
			twitchid: userid,
			display: display
		});
		return await q.save();
	}

	// Channel point manager functions

	public async makeChannelRewards(channels: string[]) {
		for (let channel of channels) {
			let exists = (await Reward.countDocuments({channel: channel}).exec()) === 1;
			if (!exists) {
				let reward = new Reward({
					channel: channel,
					rid: ""
				});
				await reward.save();
			}
		}
	}

	public async getRewardId(channel: string): Promise<string> {
		let q = (await Reward.findOne({channel: channel}).lean().exec()) as RewardType;
		if (q) return q.rid;
		return null;
	}

	public async setRewardId(channel: string, rid: string) {
		await Reward.findOneAndUpdate({channel: channel}, {rid: rid}).exec() as RewardType;
	}
	
	public async removeRewardId(channel: string) {
		await Reward.updateOne({channel: channel}, {rid:""}).exec();
	}

}
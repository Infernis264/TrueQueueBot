import { Document, Schema, LeanDocument } from "mongoose";
import * as mongoose from "mongoose";

const DRAWN_HISTORY_SIZE = 10;

const User = new Schema({
	twitchid: String,
	display: String
})

const Queue = mongoose.model("Queue", new Schema({
	queue: [User],
	drawn: [User],
	channel: String
}));
const Reward = mongoose.model("Reward", new Schema({
	rid: String,
	channel: String
}));

interface QueueType extends Document{
	channel: string;
	queue: UserType[];
	drawn: UserType[];
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
					drawn: [],
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

	public async getDrawn(channel: string): Promise<UserType[]> {
		let d = (await Queue.findOne({channel: channel}).exec()) as QueueType;
		return d.drawn;
	}

	public async getNextInQueue(channel: string): Promise<UserType> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		if (q) {
			if (q.queue.length === 0) return null;
			let user = q.queue.shift();
			// remove the oldest person from the drawn array
			if (q.drawn.length > DRAWN_HISTORY_SIZE) q.drawn.pop();
			q.drawn.unshift(user);
			
			await q.save();
			return user;
		}
		return null;
	}
	public async skipUser(channel: string, user: string): Promise<UserType> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		if (q.queue.length <= 1) return null;
		let skipped: UserType = null;
		if (user) {
			let index = q.queue.findIndex(u => u.display.toLowerCase() === user.toLowerCase());
			if (index >= 0) {
				skipped = q.queue.splice(index, 1)[0];
			}
		} else if (!user) {
			skipped = q.queue.shift();
		}
		if (skipped) {
			q.queue.push(skipped);
			await q.save();
		}
		return skipped; 
	}

	public async addUserToQueue(channel: string, userid: string, display: string): Promise<QueueType> {
		let q = await Queue.findOne({channel: channel}).exec() as QueueType;
		q.queue.push({
			twitchid: userid,
			display: display
		});
		return await q.save();
	}

	public async reQueue(channel: string, user: string): Promise<UserType> {
		let q = (await Queue.findOne({channel: channel}).exec()) as QueueType;
		let userInt = parseInt(user);
		let requeuedUser: UserType = null;

		if (userInt <= DRAWN_HISTORY_SIZE && user.length < 2) {
			if (userInt < q.drawn.length) {
				requeuedUser = q.drawn.splice(userInt - 1, 1)[0];
			}
		} else {
			let index = q.drawn.findIndex(u=>u.display.toLowerCase() === user.toLowerCase());
			if (index >= 0) {
				requeuedUser = q.drawn.splice(index, 1)[0];
			}
		}
		if (requeuedUser) {
			q.queue.push(requeuedUser);
			await q.save();
		}
		return requeuedUser;
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
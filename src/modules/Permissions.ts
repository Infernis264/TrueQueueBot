import * as TMI from "tmi.js";

export default class Permissions {
	/**
	 * Checks if a chat user has elevated permissions over a viewer
	 * @param user the chat user whose permissions are being checked
	 * @returns true if the user is a mod or broadcaster, false if they are anything else
	 */
	public static isMod(user: TMI.ChatUserstate): boolean {
		if (!user["badges-raw"]) user["badges-raw"] = "";
		return user.mod || user["badges-raw"].includes("broadcaster");
	}
	/**
	 * Checks if the user is the broadcaster
	 * @param user the user who is being checked
	 * @returns true if the user is the broadcaster, false if they aren't
	 */
	public static isBroadcaster(user: TMI.ChatUserstate): boolean {
		return user["badges-raw"].includes("broadcaster");
	}
}
# True Queue Bot 
This is a Twitch IRC chatbot that creates an ordered queue that chat members can join using a chosen channel point reward.

## Commands
* `!queue` (alias `!q`) - Displays the list of people in the queue

### Mod commands:
* `!next` - Draws the next person in line and removes them from the queue
* `!remove [name]` - Removes a user from the queue with the designated name

### Broadcaster commands:
* `!setredeem` - When used inside of a channel point redeem message, sets that reward as the reward that will be used for people joining queue
* `!delredeem` - Stops the channel point reward from letting people join the queue

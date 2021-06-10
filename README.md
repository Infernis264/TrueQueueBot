# True Queue Bot 
This is a Twitch IRC chatbot that creates an ordered queue that chat members can join using a designated channel point reward.

## Commands
* `!queue` (alias `!q`) - Displays the list of people in line in chat

### Mod commands:
* `!next` - Draws the next person in line and removes them from the queue
* `!remove [name]` - Removes a user from the queue with the designated name
* `!startq` - Allows people to join the queue and use queue commands
* `!stopq` - Disables joining the queue and prevents chatters from using queue commands

### Broadcaster commands:
* `!setredeem` - When used inside of a channel point redeem message, sets that reward as the reward that will be used for people joining queue
* `!delredeem` - Stops the channel point reward from letting people join the queue

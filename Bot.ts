import { Client, ClientOptions } from "discord.js";
import interactionCreate from "./listeners/interactionCreate";
const tokens = require("../secret/tokens.json");
import ready from "./listeners/ready";

console.log("Bot is starting...");

const client = new Client({
  intents: [],
});

ready(client);
interactionCreate(client);

client.login(tokens.discordToken);
//console.log(client);

import {
  BaseCommandInteraction,
  Client,
  ColorResolvable,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import { Command } from "../Command";
const db = require("../backend");
export const Cooldown: Command = {
  name: "cooldown",
  description: "Shows your cooldowns!",
  type: "CHAT_INPUT",
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    const user = interaction.user.id;
    let content = "COOLDOWN:";
    const userCDs = await db.cooldowns(user);
    console.log(userCDs);
    if (userCDs === null) {
      content = "Your pull is ready!";
    } else {
      content = userCDs;
    }

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};

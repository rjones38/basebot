import {
  BaseCommandInteraction,
  Client,
  ColorResolvable,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import { Command } from "../Command";
const db = require("../backend");
export const Pull: Command = {
  name: "pull",
  description: "Pulls a card!",
  type: "CHAT_INPUT",
  run: async (client: Client, interaction: BaseCommandInteraction) => {
    let content = ":)";
    const playerData = await db.pull(interaction.user.id);
    const embed = new MessageEmbed();
    if (playerData == null) {
      return;
    }
    const fingerURL = "https://i.imgur.com/T9rb3Yg.jpg";

    if (playerData === -1) {
      const cd = await db.cooldowns(interaction.user.id);
      if (cd != null) {
        content = cd;
        await interaction.followUp({
          ephemeral: true,
          content,
        });
        return;
      }
      embed.setImage(fingerURL);
    } else {
      let color = "#000000";
      embed.setTitle(playerData.name);
      if (playerData.ovr < 60) {
        color = "#CD7F32";
      } else if (playerData.ovr < 70) {
        color = "#C0C0C0";
      } else if (playerData.ovr < 85) {
        color = "#FFD700";
      } else if (playerData.ovr < 90) {
        color = "#00FFFF";
      } else {
        color = "#FF0000";
      }

      embed.setColor(color as ColorResolvable);
      embed.setDescription(
        playerData.ovr + " rated!  " + playerData.display_position
      );
      embed.setImage(await db.getPlayerImageFromUUID(playerData.uuid));
      await db.savePlayerToUser(playerData.uuid, interaction.user.id);
    }
    await interaction.followUp({
      ephemeral: true,
      content,
    });
    client.guilds.fetch("402200440982470676").then((res) => {
      res.channels.fetch("965353169251106846").then((txtChannel) => {
        (txtChannel as TextChannel).send({ embeds: [embed] });
      });
    });
  },
};

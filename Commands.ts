import { Command } from "./Command";
import { Hello } from "./commands/Hello";
import { Pull } from "./commands/Pull";
import { Cooldown } from "./commands/CD";

export const Commands: Command[] = [Pull, Cooldown];

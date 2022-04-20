import { MongoClient } from "mongodb";
import fetch from "node-fetch";
const tokens = require("../secret/tokens.json");
import mongoose from "mongoose";
import console from "console";
import { cachedDataVersionTag } from "v8";

async function buildDB() {
  const url = "https://mlb22.theshow.com/apis/items.json";
  let resp = await fetch(url);
  let data = await resp.json();

  const mongoToken = tokens.mongo;
  const mongoUri =
    "mongodb+srv://jago:" +
    mongoToken +
    "@cluster0.umwba.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = await MongoClient.connect(mongoUri).catch((err) => {
    console.log(err);
  });
  if (!client) return;
  try {
    let playerCount = 0;
    const db = client.db("db");
    let coll = db.collection("players");
    for (let page = 1; page <= data.total_pages; page++) {
      resp = await fetch(url + "?page=" + page);
      data = await resp.json();
      for (let player = 0; player < data.items.length; player++) {
        console.log("INSERTING PLAYER: " + data.items[player].name);
        await coll.insertOne({
          index: playerCount,
          uuid: data.items[player].uuid,
          name: data.items[player].name,
        });
        playerCount++;
        //client.close();
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

export async function pull(userID) {
  const mongoToken = tokens.mongo;
  const mongoUri =
    "mongodb+srv://jago:" +
    mongoToken +
    "@cluster0.umwba.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = await MongoClient.connect(mongoUri).catch((err) => {
    console.log(err);
  });
  if (!client) {
    return;
  }
  try {
    const db = client.db("db");
    const coll = db.collection("users");
    const cardsCount = await db.collection("players").count();
    //find user from ID then check his pullCD against current time
    const user = await coll.findOne({ userID: userID });
    //const ONE_HOUR = 60 * 60 * 1000; /* ms */
    //const currTime = new Date();
    if (user != null && lessThanHalfHourAgo(user.pullCD)) {
      console.log(user.pullCD + " is too soon!");
      return -1;
    }
    if (user != null && !lessThanHalfHourAgo(user.pullCD)) {
      console.log(user.pullCD + " is Not less than one hour ago! Pulling...");
      await coll.updateOne(
        { userID: userID },
        { $set: { userID: userID, pullCD: new Date() } },
        { upsert: true }
      );
    }
    if (user == null) {
      await coll.insertOne({
        userID: userID,
        pullCD: new Date(),
      });
    }

    const pullIndex = getRandomInt(0, cardsCount);

    const uuid = await db.collection("players").findOne({ index: pullIndex });
    const playerData = await getPlayerDataFromUUID(uuid.uuid);
    return playerData;
    //console.log(userID);
  } catch (err) {
  } finally {
    client.close();
  }
}

export async function cooldowns(userID) {
  const mongoToken = tokens.mongo;
  const mongoUri =
    "mongodb+srv://jago:" +
    mongoToken +
    "@cluster0.umwba.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = await MongoClient.connect(mongoUri).catch((err) => {
    console.log(err);
  });
  if (!client) {
    return;
  }
  try {
    const db = client.db("db");
    const coll = db.collection("users");
    const user = await coll.findOne({ userID: userID });
    if (user === null) {
      return null;
    }

    //let cooldowns = user.pullCD;
    //
    // probably have an array of cooldowns but for now its just the pull
    //const pullTime = new Date(user.pullCD);
    const pullTime = user.pullCD;
    const date = pullTime.setMinutes(pullTime.getMinutes() + 30);
    const diffTime = date - Date.now();
    const diffMins = diffTime / (1000 * 60);
    const diffSecs = Math.floor((diffMins % 1) * 60);

    let secondsStr = "";
    if (diffSecs < 10) {
      secondsStr = "0" + diffSecs;
    } else {
      secondsStr = diffSecs.toString();
    }

    const cdStr =
      "Pull in: " +
      Math.floor(diffMins) +
      " minutes and " +
      secondsStr +
      " seconds";

    return cdStr;
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

export async function getPlayerImageFromUUID(uuid) {
  const playerData = await getPlayerDataFromUUID(uuid);
  const imageurl = playerData["img"];

  return imageurl;
}

export async function getPlayerDataFromUUID(uuid) {
  const url = "https://mlb22.theshow.com/apis/item.json?uuid=" + uuid;
  const resp = await fetch(url);
  return await resp.json();

  //return data;
}

export async function savePlayerToUser(uuid, user) {
  const mongoToken = tokens.mongo;
  const mongoUri =
    "mongodb+srv://jago:" +
    mongoToken +
    "@cluster0.umwba.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = await MongoClient.connect(mongoUri).catch((err) => {
    console.log(err);
  });
  if (!client) {
    return;
  }
  try {
    const db = client.db("db");
    const inventory = db.collection("inventory");
    console.log("Saving " + uuid + " to user: " + user);
    await inventory.updateOne(
      { userID: user },
      { $set: { userID: user }, $push: { players: uuid } },
      { upsert: true }
    );
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

export async function getPlayerUUIDFromName(name) {
  const mongoToken = tokens.mongo;
  const mongoUri =
    "mongodb+srv://jago:" +
    mongoToken +
    "@cluster0.umwba.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = await MongoClient.connect(mongoUri).catch((err) => {
    console.log(err);
  });
  if (!client) {
    return;
  }
  try {
    const db = client.db("db");
    const coll = db.collection("players");
    const res = await coll.findOne({ name: name });
    return res.uuid;
    //console.log(res);
    //return res.uuid;
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}
async function getBryce() {
  getPlayerUUIDFromName("Bryce Harper").then((token) => {
    //console.log(token);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        //console.log("Sending Bryce");
        resolve(token.uuid);
      }, 1000);
    });
  });
}
async function testListings(page) {
  const url = "https://mlb22.theshow.com/apis/items.json?page=" + page;
  console.log(url);
  const resp = await fetch(url);
  return await resp.json();
}
async function tester() {
  const player = await getPlayerUUIDFromName("Bryce Harper");
  console.log(player);
  const img = await getPlayerImageFromUUID(player);
}

const lessThanHalfHourAgo = (date) => {
  const HALFHOUR = 1000 * 60 * 30;
  const HalfHourAgo = Date.now() - HALFHOUR;

  return date > HalfHourAgo;
};
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

//testListings(1);

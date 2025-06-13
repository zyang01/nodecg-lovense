import * as async from "async";
import axios from "axios";

export const start = async (nodecg, webdriver, driver) => {
  nodecg.log.info("Starting Stripchat extension...");
  const { By, until } = webdriver;

  await driver.get("https://stripchat.com/angelwithashotgun");

  // Wait for the username input field to be present
  await driver.wait(
    until.elementLocated(By.className("model-chat-public")),
    300_000
  );

  let oldMessageIDs = new Set();
  const pollMessages = async () => {
    const pubMessages = await driver.findElements(
      By.className("regular-public-message")
    );

    const catchupOnly = oldMessageIDs.size === 0;
    for (let message of pubMessages) {
      const messageID = await message.getAttribute("data-message-id");

      if (messageID && oldMessageIDs.has(messageID)) {
        continue;
      }
      oldMessageIDs.add(messageID);
      if (catchupOnly) {
        continue;
      }

      const messageBody = await message.findElement(
        By.className("message-body")
      );
      const username = await messageBody
        .findElement(By.className("message-username"))
        .getAttribute("textContent");
      const text = await messageBody.getAttribute("textContent");
      const chatMessage = {
        username,
        from: "s7t",
        text: text.replace(username, "").trim(),
        cssText: "color: rgb(143, 22,34);",
      };

      axios
        .post(`http://localhost:9090/coordinator/chatMessage`, chatMessage)
        .catch((err) => {
          nodecg.log.error(`Error sending chat message to API: ${err.message}`);
        });

      nodecg.log.info(`New chat message from ${JSON.stringify(chatMessage)}`);
    }

    setTimeout(async () => {
      await pollMessages();
    }, 1000);
  };

  await pollMessages();

  nodecg.log.info(
    "Stripchat extension started successfully, monitoring chat messages..."
  );
};

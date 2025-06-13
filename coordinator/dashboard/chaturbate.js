const eventsApiTokenUrl = document.querySelector(
  "#chaturbateEventsApiTokenUrl"
);
const eventsApiTokenUrlReplicant = nodecg.Replicant(
  "chaturbateEventsApiTokenUrl"
);
NodeCG.waitForReplicants(eventsApiTokenUrlReplicant).then(() => {
  eventsApiTokenUrl.value = eventsApiTokenUrlReplicant.value;

  const startChaturbate = document.querySelector("#startChaturbate");

  startChaturbate.onclick = () => {
    startChaturbate.disabled = true;
    startChaturbate.innerText = "Started";

    eventsApiTokenUrlReplicant.value = eventsApiTokenUrl.value;

    nodecg
      .sendMessage("startChaturbate")
      .catch((error) => {
        console.error("Error starting Chaturbate:", error);
      })
      .finally(() => {
        startChaturbate.disabled = false;
        startChaturbate.innerText = "Start Chaturbate";
      });
  };
});

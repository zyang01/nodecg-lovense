import axios from "axios";

export const start = async (nodecg) => {
  const eventsApiTokenUrlReplicant = nodecg.Replicant(
    "chaturbateEventsApiTokenUrl",
    {
      defaultValue:
        "https://chaturbate.com/in/?tour=LQps&campaign=zMPU0&track=default&room=angelwithashotgun_gay",
    }
  );

  const longPolling = async (tokenUrl) => {
    axios
      .get(tokenUrl, { timeout: 13_000 })
      .then((res) => {
        nodecg.log.info(
          "Chaturbate long polled events: %d",
          res.data.events?.length
        );

        res.data.events?.forEach((event) => {
          if (event.method === "chatMessage") {
            const text = event.object?.message?.message || "";
            const isPrivateMessage =
              "fromUser" in event.object?.message ||
              "toUser" in event.object?.message;

            const chatMessage = {
              username: event.object?.user?.username,
              from: "c8e",
              text: isPrivateMessage ? `sent you a private message` : text,
              cssText: `color: #f47321; background-color: ${event.object?.message?.backgroundColor};`,
              privateText: isPrivateMessage ? `[Private] ${text}` : "",
            };

            axios
              .post(
                `http://localhost:9090/coordinator/chatMessage`,
                chatMessage
              )
              .catch((err) => {
                nodecg.log.error(
                  `Error sending chat message to API: ${err.message}`
                );
              });

            nodecg.log.info(
              `New chat message from ${JSON.stringify(chatMessage)}`
            );
          } else {
            nodecg.log.info("Skipped event:", JSON.stringify(event));
          }
        });

        // Update the URL for the next request if nextUrl exists
        longPolling(res.data.nextUrl || eventsApiTokenUrlReplicant.value);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        longPolling(eventsApiTokenUrlReplicant.value); // Revert to the original URL on error
      });
  };

  longPolling(eventsApiTokenUrlReplicant.value);

  nodecg.log.info(
    "Chaturbate extension started with URL:",
    eventsApiTokenUrlReplicant.value
  );
  nodecg.log.info(
    "Chaturbate extension started successfully, monitoring chat messages..."
  );
};

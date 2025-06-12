const axios = require("axios");
const https = require("https");
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
  keepAlive: true, // Keep the connection alive for reuse
  timeout: 5000, // Set a timeout for requests
});

function setCustomRoutes(nodecg, actionsQueueReplicant) {
  const router = nodecg.Router();

  router.post("/chatMessage", (req, res) => {
    nodecg.log.info("Received chat message:", JSON.stringify(req.body));
    nodecg.sendMessage("chatMessage", req.body);
    res.send("OK!");
  });

  router.post("/action", (req, res) => {
    nodecg.log.info("Received action:", JSON.stringify(req.body));
    actionsQueueReplicant.value.push(req.body);
    nodecg.sendMessage("action");
    res.send("Roger that!");
  });

  nodecg.mount("/coordinator", router); // The route '/coordinator/chatMessage` is now available
}

async function triggerAction(
  nodecg,
  actionsQueueReplicant,
  runningActionReplicant,
  deviceListReplicant,
  lovenseRemoteURLReplicant
) {
  if (
    Object.keys(runningActionReplicant.value).length === 0 &&
    actionsQueueReplicant.value.length > 0 &&
    deviceListReplicant.value.length > 0
  ) {
    const res = await axios.post(
      lovenseRemoteURLReplicant.value,
      {
        command: "Function",
        action: "All:20",
        timeSec: actionsQueueReplicant.value[0].duration,
        stopPrevious: 0,
        apiVer: 1,
      },
      {
        httpsAgent: httpsAgent, // Use the custom HTTPS agent
      }
    );

    if (res.status !== 200 || res.data.code !== 200) {
      nodecg.log.error("Failed to send action to Lovense Remote:", res.data);
      return;
    }

    Object.assign(
      runningActionReplicant.value,
      actionsQueueReplicant.value.shift()
    );
    nodecg.log.info(`Running action: ${runningActionReplicant.value}`);

    setTimeout(
      () => {
        nodecg.log.info(`Completed action: ${runningActionReplicant.value}`);
        runningActionReplicant.value = {};
        nodecg.sendMessage("action");
      },
      runningActionReplicant.value.duration * 1_000 - 500
    );
  }
}

function connectToLovenseRemote(
  nodecg,
  lovenseRemoteURLReplicant,
  deviceListReplicant
) {
  nodecg.log.debug(
    `Connecting to Lovense Remote with URL: ${lovenseRemoteURLReplicant.value}`
  );

  axios
    .post(
      lovenseRemoteURLReplicant.value,
      { command: "GetToys" },
      {
        httpsAgent: httpsAgent, // Use the custom HTTPS agent
      }
    )
    .then((response) => {
      if (response.status === 200 && response.data.code === 200) {
        nodecg.log.info(
          `Successfully connected to Lovense Remote: ${lovenseRemoteURLReplicant.value}`
        );

        const devices = Object.values(JSON.parse(response.data.data?.toys));
        devices.sort((a, b) => {
          if (a.status > b.status) return -1;
          if (a.status < b.status) return 1;
          return `${a.name} ${a.version}`.localeCompare(
            `${b.name} ${b.version}`
          );
        });
        deviceListReplicant.value = devices;

        nodecg.log.info("Connected devices:", devices);
      } else {
        nodecg.log.error(
          `Connection failed with unexpected response: ${response.data}`
        );
      }
    })
    .catch((error) => {
      nodecg.log.error(`Connection error: ${error}`);
    });
}

module.exports = function (nodecg) {
  const deviceListReplicant = nodecg.Replicant("deviceList", {
    defaultValue: [],
  });
  deviceListReplicant.value = [];

  const actionsQueueReplicant = nodecg.Replicant("actionsQueue", {
    defaultValue: [],
  });

  const lovenseRemoteURLReplicant = nodecg.Replicant("lovenseRemoteURL", {
    defaultValue: "https://localhost:30010/command",
  });

  const runningActionReplicant = nodecg.Replicant("runningAction", {
    defaultValue: {},
  });

  nodecg.log.info("Coordinator extension is starting...");

  setInterval(() => {
    connectToLovenseRemote(
      nodecg,
      lovenseRemoteURLReplicant,
      deviceListReplicant
    );
  }, 5000); // Attempt to connect every 5 seconds

  nodecg.listenFor("action", () => {
    triggerAction(
      nodecg,
      actionsQueueReplicant,
      runningActionReplicant,
      deviceListReplicant,
      lovenseRemoteURLReplicant
    );
  });

  setCustomRoutes(nodecg, actionsQueueReplicant);
};

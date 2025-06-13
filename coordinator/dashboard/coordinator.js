const lovenseRemoteURLInput = document.querySelector("#lovenseRemoteURL");
const lovenseRemoteURLReplicant = nodecg.Replicant("lovenseRemoteURL");
NodeCG.waitForReplicants(lovenseRemoteURLReplicant).then(() => {
  lovenseRemoteURLInput.value = lovenseRemoteURLReplicant.value;
});

const connectButton = document.querySelector("#connectButton");
const connectionStatus = document.querySelector("#connectionStatus");
const deviceList = document.querySelector("#deviceList");
const deviceListReplicant = nodecg.Replicant("deviceList");
NodeCG.waitForReplicants(deviceListReplicant).then(() => {
  connectButton.onclick = () => {
    lovenseRemoteURLReplicant.value = lovenseRemoteURLInput.value;
  };

  deviceListReplicant.on("change", (devices) => {
    if (!Array.isArray(devices) || devices.length === 0) {
      deviceList.innerHTML = "<tr><td colspan='5'>No devices found</td></tr>";
      connectionStatus.innerText = "Disconnected";
      connectionStatus.style.color = "red";
      return;
    }

    deviceList.innerHTML = devices.reduce(
      (html, device) =>
        html +
        `<tr>
                <td>${device.nickName}</td>
                <td>${device.id}</td>
                <td>${device.name} ${device.version}</td>
                <td>${device.battery}%</td>
                ${device.status === "0" ? '<td style="color: red;">OFF</td>' : '<td style="color: green;">ON</td>'}
            </tr>`,
      ""
    );

    connectionStatus.innerText = "Connected";
    connectionStatus.style.color = "green";
  });
});

const actionsQueue = document.querySelector("#actionsQueue");
const actionsQueueReplicant = nodecg.Replicant("actionsQueue");
NodeCG.waitForReplicants(actionsQueueReplicant).then(() => {
  actionsQueueReplicant.on("change", (actions) => {
    if (!Array.isArray(actions) || actions.length === 0) {
      actionsQueue.innerHTML =
        "<tr><td colspan='3'>No actions in queue</td></tr>";
      return;
    }

    actionsQueue.innerHTML = actions.reduce(
      (html, action) =>
        html +
        `<tr>
                <td>${action.name}</td>
                <td>${action.duration}</td>
                <td>${action.patron}</td>
            </tr>`,
      ""
    );
  });
});

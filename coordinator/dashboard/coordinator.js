const connectButton = document.querySelector("#connectButton");
const connectionStatus = document.querySelector("#connectionStatus");
const lovenseRemoteURLInput = document.querySelector("#lovenseRemoteURL");

const lovenseRemoteURLReplicant = nodecg.Replicant("lovenseRemoteURL");
NodeCG.waitForReplicants(lovenseRemoteURLReplicant).then(() => {
  lovenseRemoteURLInput.value = lovenseRemoteURLReplicant.value;
});

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

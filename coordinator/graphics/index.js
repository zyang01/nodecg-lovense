const chatMessageContainer = document.getElementById("chatMessage-container");

function createChatMessageElement(text, cssText) {
  const chatMessage = document.createElement("div");
  chatMessage.classList.add("chatMessage");
  chatMessage.textContent = text;

  const maxHeight = chatMessageContainer.clientHeight;
  const randomHeight =
    Math.max(0.05, Math.min(Math.random(), 0.95)) * maxHeight;
  chatMessage.style.top = `${randomHeight}px`;
  chatMessage.style.cssText += cssText || "";
  chatMessage.classList.add("shining-text");

  chatMessageContainer.appendChild(chatMessage);
  chatMessage.addEventListener("animationend", () => {
    chatMessageContainer.removeChild(chatMessage);
  });
}

nodecg.listenFor("chatMessage", (message) => {
  const textMessage = `${message.username}@${message.from}: ${message.text}`;
  createChatMessageElement(textMessage, message.cssText || "");
  nodecg.log.info("Created chat message:", textMessage);
});

document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll(".graphics-container");
  const scrollDelay = 30; // Adjust the delay to control the smoothness
  const pauseDelay = 5000; // Pause duration (ms) after changing direction
  const scrollDuration = 5000; // Target duration (ms) for a full scroll

  containers.forEach((container) => {
    let scrollPosition = 0;
    let scrollInterval;
    let direction = 1; // 1 for down, -1 for up
    let isPaused = false;

    function getDynamicSpeed() {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const distance = Math.max(1, scrollHeight - clientHeight);
      const steps = Math.ceil(scrollDuration / scrollDelay);
      return distance / steps;
    }

    function startScrolling() {
      clearInterval(scrollInterval);
      isPaused = false;

      let scrollHeight = container.scrollHeight;
      let clientHeight = container.clientHeight;
      let scrollSpeed = getDynamicSpeed();

      scrollInterval = setInterval(() => {
        if (isPaused) return;

        if (direction === 1 && scrollPosition < scrollHeight - clientHeight) {
          scrollPosition += scrollSpeed;
          if (scrollPosition >= scrollHeight - clientHeight) {
            scrollPosition = scrollHeight - clientHeight;
            container.scrollTop = scrollPosition;
            direction = -1; // Change direction to up
            isPaused = true;
            setTimeout(() => {
              scrollSpeed = getDynamicSpeed();
              isPaused = false;
            }, pauseDelay);
          }
        } else if (direction === -1 && scrollPosition > 0) {
          scrollPosition -= scrollSpeed;
          if (scrollPosition <= 0) {
            scrollPosition = 0;
            container.scrollTop = scrollPosition;
            direction = 1; // Change direction to down
            isPaused = true;
            setTimeout(() => {
              scrollSpeed = getDynamicSpeed();
              isPaused = false;
            }, pauseDelay);
          }
        }
        // Clamp scrollPosition to valid range
        scrollPosition = Math.max(
          0,
          Math.min(scrollPosition, scrollHeight - clientHeight)
        );
        container.scrollTop = scrollPosition;
      }, scrollDelay);
    }

    // MutationObserver to watch for changes in the content
    const observer = new MutationObserver(() => {
      scrollPosition = 0; // Reset scroll position on content change
      direction = 1; // Always start scrolling down on content change
      container.scrollTop = scrollPosition;
      startScrolling(); // Restart scrolling with updated content
    });

    // Configuring the observer
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    startScrolling(); // Initiate scrolling for each container
  });
});

const deviceList = document.querySelector("#deviceList");
const deviceListReplicant = nodecg.Replicant("deviceList");
deviceListReplicant.on("change", (devices) => {
  if (!Array.isArray(devices) || devices.length == 0) {
    deviceList.innerHTML =
      "<tr><td colspan='3'>No devices connected.</td></tr>";
    return;
  }

  deviceList.innerHTML = devices.reduce(
    (html, device) =>
      html +
      `<tr>
            <td>${device.name} ${device.version} (${device.id.slice(-4)})</td>
            <td>${device.battery}%</td>
            ${device.status === "0" ? '<td style="color: red;">OFF</td>' : '<td style="color: green;">ON</td>'}
        </tr>`,
    ""
  );
});

const actionsQueue = document.querySelector("#actionsQueue");
const actionsQueueReplicant = nodecg.Replicant("actionsQueue");
actionsQueueReplicant.on("change", (actions) => {
  if (!Array.isArray(actions) || actions.length == 0) {
    actionsQueue.innerHTML =
      "<tr><td colspan='3'>No actions in queue.</td></tr>";
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

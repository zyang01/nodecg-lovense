const startStripchat = document.querySelector("#startStripchat");

startStripchat.onclick = () => {
  startStripchat.disabled = true;
  startStripchat.innerText = "Started";

  nodecg
    .sendMessage("startStripchat")
    .catch((error) => {
      console.error("Error starting Stripchat:", error);
    })
    .finally(() => {
      startStripchat.disabled = false;
      startStripchat.innerText = "Start Stripchat";
    });
};

const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
browser.runtime.onMessage.addListener(popupMessageHandler);
function popupMessageHandler(message, sender) {
    switch (message === null || message === void 0 ? void 0 : message.event) {
        case "first-bind":
            firstBind();
            return Promise.resolve(true);
        case "show-reward":
            showReward(message.data.data, message.data.reward);
            return Promise.resolve(true);
        default:
            console.log("unhandled message in popup", message, sender);
            break;
    }
    return false;
}
function firstBind() {
    const result = document.getElementById("result");
    const container = document.createElement("div");
    const notice = document.createElement("div");
    const link = document.createElement("a");
    notice.textContent = "You need to manually check in once before this tool can work.";
    link.textContent = "Go to Check-In page";
    link.href = REFERER_URL;
    container.append(notice);
    container.append(link);
    while (result.firstChild) {
        result.firstChild.remove();
    }
    result.append(container);
}
function showReward(data, reward) {
    const result = document.getElementById("result");
    const infoContainer = document.createElement("div");
    const imgContainer = document.createElement("div");
    const checkInCount = document.createElement("div");
    const today = document.createElement("div");
    const alreadyCheckedIn = document.createElement("div");
    const rewardName = document.createElement("div");
    const img = document.createElement("img");
    checkInCount.textContent = "Total check-ins this month: " + data.total_sign_day;
    today.textContent = data.today;
    alreadyCheckedIn.textContent = data.is_sign ? "Already checked in today..." : "Successfully checked in!";
    infoContainer.append(today);
    infoContainer.append(checkInCount);
    infoContainer.append(alreadyCheckedIn);
    rewardName.textContent = reward.name + " x" + reward.cnt;
    img.src = reward.icon;
    imgContainer.append(rewardName);
    imgContainer.append(img);
    while (result.firstChild) {
        result.firstChild.remove();
    }
    result.append(infoContainer);
    result.append(imgContainer);
}
document.getElementById("fetch-action").addEventListener("click", function () {
    browser.runtime.sendMessage({
        event: "manual-check-in",
        data: null
    });
});

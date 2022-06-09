const DEBUG = 1;
const HOME_URL = DEBUG ? "http://localhost:3000/home" : "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
async function onPopupOpen() {
    var _a, _b;
    const status = await sendMessage("get-status", null);
    if (!status) {
        console.error("communication with background script failed");
        return;
    }
    if (status.lastResult === null) {
        console.error("no result to read");
    }
    else if (status.lastResult === "error" || status.lastResult === "incomplete") {
        console.error("background script not ready");
    }
    else {
        console.debug(status.lastResult);
        const data = status.lastResult.result.data;
        const home = await fetch(HOME_URL)
            .then(e => e.json())
            .catch(e => console.log("error during fetch home", e));
        const i = data.total_sign_day - 1;
        const reward = (_b = (_a = home === null || home === void 0 ? void 0 : home.data) === null || _a === void 0 ? void 0 : _a.awards) === null || _b === void 0 ? void 0 : _b[i];
        if (status.lastResult.success) {
            showReward(data, reward);
        }
        else {
            firstBind();
        }
    }
}
async function sendMessage(event, data) {
    return browser.runtime.sendMessage({
        event: event,
        data: data
    });
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
    // browser.runtime.sendMessage({
    // 	event: "manual-check-in",
    // 	data: null
    // });
});
onPopupOpen();

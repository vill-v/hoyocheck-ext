const DEBUG = 1;
const HOME_URL = DEBUG ? "http://localhost:3000/home" : "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
console.log("popup opened", Date.now());
async function onPopupOpen() {
    const status = await sendMessage("get-status", null);
    if (!status) {
        console.error("communication with background script failed");
        return;
    }
    if (status.lastResult === null) {
        console.error("no result to read");
    }
    else {
        console.debug(status);
        await displayInfo(status);
    }
}
async function sendMessage(event, data) {
    return browser.runtime.sendMessage({
        event: event,
        data: data
    });
}
async function displayInfo(status) {
    const statusMessage = document.getElementById("status");
    const lastRun = document.getElementById("prev-check-in");
    const nextRun = document.getElementById("next-check-in");
    lastRun.innerHTML = formatDate(status.lastRun);
    nextRun.innerHTML = formatCountdown(status.nextRun);
    if (status.lastResult === "incomplete") {
        statusMessage.innerHTML = "In progress...";
    }
    else if (status.lastResult === "error") {
        statusMessage.innerHTML = "Error";
    }
    else {
        if (status.lastResult.success) {
            if (status.lastResult.checkinAttempted) {
                statusMessage.innerHTML = "Successfully checked in!";
            }
            else {
                statusMessage.innerHTML = "Already checked in today...";
            }
            await getAndShowReward(status.lastResult.result.data);
        }
        else {
            statusMessage.innerHTML = "Check-in failed";
            firstBind();
        }
    }
}
async function getAndShowReward(data) {
    var _a, _b;
    const home = await fetch(HOME_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch home", e));
    const i = data.total_sign_day - 1;
    const reward = (_b = (_a = home === null || home === void 0 ? void 0 : home.data) === null || _a === void 0 ? void 0 : _a.awards) === null || _b === void 0 ? void 0 : _b[i];
    showReward(data, reward);
}
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}
function formatCountdown(timestamp) {
    const diff = timestamp - Date.now();
    if (diff <= 0) {
        return "in the past!";
    }
    const s = Math.trunc(diff / 1000);
    const m = Math.trunc(s / 60);
    const h = Math.trunc(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
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
    // Mihoyo date, may be different from local time
    // const today = document.createElement("div");
    const rewardName = document.createElement("div");
    const img = document.createElement("img");
    checkInCount.textContent = "Total check-ins this month: " + data.total_sign_day;
    // today.textContent = data.today;
    // infoContainer.append(today);
    infoContainer.append(checkInCount);
    rewardName.textContent = `Reward: ${reward.name} x${reward.cnt}`;
    img.src = reward.icon;
    img.style.width = "32px";
    img.style.height = "32px";
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

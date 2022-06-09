const DEBUG = 1;
const HOME_URL = DEBUG ? "http://localhost:3000/home" : "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
const ICON_LOOKUP = {
    "Adventurer's Experience": "/icons/reward-adv.png",
    "Bird Egg": "/icons/reward-egg.png",
    "Fine Enhancement Ore": "/icons/reward-ore.png",
    "Fish": "/icons/reward-fish.png",
    "Fowl": "/icons/reward-fowl.png",
    "Hero's Wit": "/icons/reward-hero.png",
    "Mora": "/icons/reward-mora.png",
    "Primogem": "/icons/reward-primo.png",
    "Raw Meat": "/icons/reward-meat.png",
};
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
    var _a, _b, _c, _d;
    const home = await fetch(HOME_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch home", e));
    const i = data.total_sign_day - 1;
    const reward = (_b = (_a = home === null || home === void 0 ? void 0 : home.data) === null || _a === void 0 ? void 0 : _a.awards) === null || _b === void 0 ? void 0 : _b[i];
    const daysInMonth = (_d = (_c = home === null || home === void 0 ? void 0 : home.data) === null || _c === void 0 ? void 0 : _c.awards) === null || _d === void 0 ? void 0 : _d.length;
    showReward(data, reward, daysInMonth);
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
function rewardImgFrame(reward, day, claimed, loading) {
    const container = document.getElementById("checkin-frame");
    while (container.firstChild) {
        container.firstChild.remove();
    }
    if (reward) {
        const frame = document.createElement("img");
        frame.src = claimed ? "/icons/frame-claimed.png" : "/icons/frame-active.png";
        frame.classList.add("frame");
        const rewardPic = document.createElement("img");
        rewardPic.src = ICON_LOOKUP[reward.name];
        rewardPic.classList.add("reward-pic");
        const checkmark = document.createElement("img");
        checkmark.src = "/icons/frame-claimed.png";
        checkmark.classList.add("checkmark");
        const quantity = document.createElement("span");
        quantity.textContent = `x${reward.cnt}`;
        quantity.classList.add("reward-quantity");
        const rewardDay = document.createElement("span");
        rewardDay.textContent = `Day ${day}`;
        rewardDay.classList.add("reward-day");
        container.append(frame);
        container.append(rewardPic);
        container.append(checkmark);
        container.append(quantity);
        container.append(rewardDay);
    }
    else if (loading) {
        const frame = document.createElement("img");
        frame.src = "/icons/frame-active.png";
        frame.classList.add("frame");
        const rewardDay = document.createElement("span");
        rewardDay.textContent = `Loading...`;
        rewardDay.classList.add("reward-day");
        container.append(frame);
        container.append(rewardDay);
    }
    else {
        const frame = document.createElement("img");
        frame.src = "/icons/frame-active.png";
        frame.classList.add("frame");
        const rewardPic = document.createElement("img");
        rewardPic.src = "/icons/fail-32.png";
        rewardPic.classList.add("reward-pic");
        const rewardDay = document.createElement("span");
        rewardDay.textContent = `Error`;
        rewardDay.classList.add("reward-day");
        container.append(frame);
        container.append(rewardPic);
        container.append(rewardDay);
    }
}
function showReward(data, reward, daysInMonth) {
    const result = document.getElementById("result");
    const infoContainer = document.createElement("div");
    const checkInCount = document.createElement("div");
    rewardImgFrame(reward, data.total_sign_day, data.is_sign);
    checkInCount.textContent = `Total check-ins this month: ${data.total_sign_day}/${daysInMonth}`;
    infoContainer.append(checkInCount);
    while (result.firstChild) {
        result.firstChild.remove();
    }
    result.append(infoContainer);
}
document.getElementById("checkin-frame").addEventListener("click", function () {
    rewardImgFrame(null, 0, false, true);
    browser.runtime.sendMessage({
        event: "manual-check-in",
        data: null
    });
});
onPopupOpen();

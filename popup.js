const INFO_URL = "https://hk4e-api-os.mihoyo.com/event/sol/info?lang=en-us&act_id=e202102251931481";
const SIGN_URL = "https://hk4e-api-os.mihoyo.com/event/sol/sign?lang=en-us";
const HOME_URL = "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
async function checkin(signInExecuted) {
    var _a, _b;
    const info = await fetch(INFO_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch info", e));
    const data = readMihoyoInfo(info);
    if (data === null || data.first_bind) {
        firstBind();
        return;
    }
    if (!data.is_sign) {
        if (signInExecuted) {
            console.error("sign in failed");
            return;
        }
        else {
            await doSignIn();
            return checkin(true);
        }
    }
    const home = await fetch(HOME_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch home", e));
    const i = data.total_sign_day - 1;
    const reward = (_b = (_a = home === null || home === void 0 ? void 0 : home.data) === null || _a === void 0 ? void 0 : _a.awards) === null || _b === void 0 ? void 0 : _b[i];
    showReward(data, reward);
}
function readMihoyoInfo(info) {
    if (info["retcode"] === -100) {
        console.error(info["message"]);
    }
    else if (info["retcode"] === 0) {
        return info["data"];
    }
    else {
        console.error("unexpected ret code in readMihoyoInfo", info);
    }
    return null;
}
async function doSignIn() {
    const options = {
        method: "POST",
        headers: {
            "Content-type": "application/json;charset=UTF-8"
        },
        body: `{"act_id": "e202102251931481"}`
    };
    const result = await fetch(SIGN_URL, options)
        .then(e => e.json())
        .catch(e => console.log("error during fetch info", e));
    if (result.retcode === 0) {
        console.log("successfully checked in!");
    }
    else if (result.retcode === -5003) {
        console.log(result.message);
    }
    else {
        console.error("unexpected ret code from api in doSignIn", result);
    }
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
    checkin();
});

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const INFO_URL = "https://hk4e-api-os.mihoyo.com/event/sol/info?lang=en-us&act_id=e202102251931481";
const SIGN_URL = "https://hk4e-api-os.mihoyo.com/event/sol/sign?lang=en-us&act_id=e202102251931481";
const HOME_URL = "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
function checkin() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield fetch(INFO_URL)
            .then(e => e.json())
            .catch(e => console.log("error during fetch info", e));
        const data = readMihoyoInfo(info);
        if (data === null || data.first_bind) {
            firstBind();
            return;
        }
        if (!data.is_sign) {
            doSignIn();
        }
        const home = yield fetch(HOME_URL)
            .then(e => e.json())
            .catch(e => console.log("error during fetch home", e));
        const i = data.total_sign_day - 1;
        const reward = (_b = (_a = home === null || home === void 0 ? void 0 : home.data) === null || _a === void 0 ? void 0 : _a.awards) === null || _b === void 0 ? void 0 : _b[i];
        showReward(data, reward);
    });
}
function readMihoyoInfo(info) {
    if (info["retcode"] === -100) {
        console.error(info["message"]);
    }
    else if (info["retcode"] === 0) {
        return info["data"];
    }
    throw new Error();
}
function doSignIn() {
    //
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

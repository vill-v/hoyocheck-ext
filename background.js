const DEBUG = 1;
const INFO_URL = DEBUG ? "http://localhost:3000/info" : "https://hk4e-api-os.mihoyo.com/event/sol/info?lang=en-us&act_id=e202102251931481";
const SIGN_URL = DEBUG ? "http://localhost:3000/sign" : "https://hk4e-api-os.mihoyo.com/event/sol/sign?lang=en-us";
const HOME_URL = DEBUG ? "http://localhost:3000/home" : "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
browser.runtime.onStartup.addListener(onBrowserStart);
browser.alarms.onAlarm.addListener(onAlarm);
browser.runtime.onMessage.addListener(backgroundMessageHandler);
checkin();
function onBrowserStart() {
    checkin();
    console.log("browser start", Date.now());
}
function onAlarm(alarm) {
    if (alarm.name === "check-in-alarm") {
        checkin();
    }
    console.log("alarm activated", alarm.name, Date.now());
}
function backgroundMessageHandler(message, sender) {
    switch (message === null || message === void 0 ? void 0 : message.event) {
        case "manual-check-in":
            checkin();
            return Promise.resolve(true);
        default:
            console.log("unhandled message in background", message, sender);
            break;
    }
    return false;
}
function sendMessage(event, data) {
    browser.runtime.sendMessage({
        event: event,
        data: data
    });
}
function setupNextAlarm() {
    const now = Date.now();
    const randomOffset = Math.trunc(Math.random() * 10 * MINUTES - 5 * MINUTES);
    const nextTime = DEBUG ? now + 0.5 * MINUTES : now + DAYS + randomOffset;
    browser.alarms.create("check-in-alarm", { when: nextTime });
}
async function checkin(signInExecuted) {
    var _a, _b;
    const info = await fetch(INFO_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch info", e));
    const data = readMihoyoInfo(info);
    if (data === null || data.first_bind) {
        sendMessage("first-bind", null);
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
    sendMessage("show-reward", { data: data, reward: reward });
    setupNextAlarm();
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

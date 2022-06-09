const DEBUG = 1;
const INFO_URL = DEBUG ? "http://localhost:3000/info" : "https://hk4e-api-os.mihoyo.com/event/sol/info?lang=en-us&act_id=e202102251931481";
const SIGN_URL = DEBUG ? "http://localhost:3000/sign" : "https://hk4e-api-os.mihoyo.com/event/sol/sign?lang=en-us";
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
let appStatus = {
    lastResult: null,
    lastRun: 0,
    lastCheckin: 0,
    nextRun: 0
};
console.log("background script loaded", Date.now());
browser.runtime.onStartup.addListener(onBrowserStart);
browser.alarms.onAlarm.addListener(onAlarm);
browser.runtime.onMessage.addListener(backgroundMessageHandler);
checkin().then(updateStatus).catch(updateStatusError);
function onBrowserStart() {
    checkin().then(updateStatus).catch(updateStatusError);
    console.log("browser start", Date.now());
}
function onAlarm(alarm) {
    if (alarm.name === "check-in-alarm") {
        checkin().then(updateStatus).catch(updateStatusError);
    }
    console.log("alarm activated", alarm.name, Date.now());
}
function backgroundMessageHandler(message, sender) {
    switch (message === null || message === void 0 ? void 0 : message.event) {
        case "get-status":
            return Promise.resolve(appStatus);
        case "manual-check-in":
            return checkin().then(updateStatus).catch(updateStatusError);
        default:
            console.log("unhandled message in background", message, sender);
            break;
    }
    return false;
}
function updateStatus(checkinResult) {
    appStatus.lastResult = checkinResult;
    appStatus.nextRun = checkinResult.nextRun;
    return appStatus;
}
function updateStatusError(err) {
    console.error("checkin error", err);
    appStatus.lastResult = "error";
    return appStatus;
}
function setupNextAlarm() {
    const now = Date.now();
    const randomOffset = Math.trunc(Math.random() * 10 * MINUTES - 5 * MINUTES);
    const nextTime = DEBUG ? now + 0.5 * MINUTES : now + DAYS + randomOffset;
    browser.alarms.create("check-in-alarm", { when: nextTime });
    return nextTime;
}
async function checkin(signInExecuted) {
    appStatus.lastResult = "incomplete";
    appStatus.lastRun = Date.now();
    appStatus.nextRun = 0;
    const info = await fetch(INFO_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch info", e));
    const data = readMihoyoInfo(info);
    if (data === null || data.first_bind) {
        // ask user to check in manually
        return Promise.resolve({
            success: false,
            checkinAttempted: false,
            nextRun: 0,
            result: null
        });
    }
    if (!data.is_sign) {
        if (signInExecuted) {
            console.error("sign in failed");
            return Promise.resolve({
                success: false,
                checkinAttempted: true,
                nextRun: 0,
                result: info
            });
        }
        else {
            await doSignIn();
            return checkin(true);
        }
    }
    const next = setupNextAlarm();
    return Promise.resolve({
        success: data.is_sign,
        checkinAttempted: !!signInExecuted,
        nextRun: next,
        result: info
    });
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
    appStatus.lastCheckin = Date.now();
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

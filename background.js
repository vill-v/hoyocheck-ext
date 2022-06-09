const DEBUG = 1;
const INFO_URL = DEBUG ? "http://localhost:3000/info" : "https://hk4e-api-os.mihoyo.com/event/sol/info?lang=en-us&act_id=e202102251931481";
const SIGN_URL = DEBUG ? "http://localhost:3000/sign" : "https://hk4e-api-os.mihoyo.com/event/sol/sign?lang=en-us";
const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const BrowserIcons = {
    default: { path: { 16: "icons/16.png", 32: "icons/32.png" } },
    succ: { path: { 16: "icons/succ-16.png", 32: "icons/succ-32.png" } },
    fail: { path: { 16: "icons/fail-16.png", 32: "icons/fail-32.png" } },
    load_0: { path: { 16: "icons/load-0-16.png", 32: "icons/load-0-32.png" } },
    load_1: { path: { 16: "icons/load-1-16.png", 32: "icons/load-1-32.png" } },
    load_2: { path: { 16: "icons/load-2-16.png", 32: "icons/load-2-32.png" } },
    load_3: { path: { 16: "icons/load-3-16.png", 32: "icons/load-3-32.png" } },
};
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
run();
function onBrowserStart() {
    run();
    console.log("browser start", Date.now());
}
function onAlarm(alarm) {
    if (alarm.name === "check-in-alarm") {
        run();
    }
    console.log("alarm activated", alarm.name, Date.now());
}
function backgroundMessageHandler(message, sender) {
    switch (message === null || message === void 0 ? void 0 : message.event) {
        case "get-status":
            return Promise.resolve(appStatus);
        case "manual-check-in":
            return run();
        default:
            console.log("unhandled message in background", message, sender);
            break;
    }
    return false;
}
function updateStatus(checkinResult) {
    appStatus.lastResult = checkinResult;
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
async function loadingCycle() {
    while (appStatus.lastResult === "incomplete") {
        await loadingAnimation();
    }
}
async function loadingAnimation() {
    await Promise.all([
        browser.browserAction.setIcon(BrowserIcons.load_0),
        new Promise(resolve => setTimeout(resolve, 500))
    ]);
    await Promise.all([
        browser.browserAction.setIcon(BrowserIcons.load_1),
        new Promise(resolve => setTimeout(resolve, 500))
    ]);
    await Promise.all([
        browser.browserAction.setIcon(BrowserIcons.load_2),
        new Promise(resolve => setTimeout(resolve, 500))
    ]);
    await Promise.all([
        browser.browserAction.setIcon(BrowserIcons.load_3),
        new Promise(resolve => setTimeout(resolve, 500))
    ]);
}
async function updateIcon() {
    var _a;
    if (appStatus.lastResult === "error") {
        await browser.browserAction.setIcon(BrowserIcons.fail);
    }
    else if (appStatus.lastResult === "incomplete") {
        throw new Error("updateIcon called while app status is still incomplete");
    }
    else if ((_a = appStatus.lastResult) === null || _a === void 0 ? void 0 : _a.result) {
        await browser.browserAction.setIcon(BrowserIcons.succ);
    }
    else {
        await browser.browserAction.setIcon(BrowserIcons.fail);
    }
}
async function run() {
    appStatus.lastResult = "incomplete";
    appStatus.lastRun = Date.now();
    appStatus.nextRun = 0;
    loadingCycle().then(updateIcon);
    return checkin().then(updateStatus).catch(updateStatusError);
}
async function checkin(signInExecuted) {
    const info = await fetch(INFO_URL)
        .then(e => e.json())
        .catch(e => console.log("error during fetch info", e));
    const data = readMihoyoInfo(info);
    if (data === null || data.first_bind) {
        // ask user to check in manually
        return Promise.resolve({
            success: false,
            checkinAttempted: false,
            result: null
        });
    }
    if (!data.is_sign) {
        if (signInExecuted) {
            console.error("sign in failed");
            return Promise.resolve({
                success: false,
                checkinAttempted: true,
                result: info
            });
        }
        else {
            await doSignIn();
            return checkin(true);
        }
    }
    appStatus.nextRun = setupNextAlarm();
    return Promise.resolve({
        success: data.is_sign,
        checkinAttempted: !!signInExecuted,
        result: info
    });
}
function readMihoyoInfo(info) {
    if (!info ||
        !Object.prototype.hasOwnProperty.call(info, "retcode") ||
        !Object.prototype.hasOwnProperty.call(info, "message") ||
        !Object.prototype.hasOwnProperty.call(info, "data")) {
        console.error("malformed MihoyoInfo object in readMihoyoInfo, fetch may have failed", info);
        return null;
    }
    if (info.retcode === -100) {
        console.error(info["message"]);
    }
    else if (info.retcode === 0) {
        const data = info.data;
        if (!data ||
            !Object.prototype.hasOwnProperty.call(data, "total_sign_day") ||
            !Object.prototype.hasOwnProperty.call(data, "today") ||
            !Object.prototype.hasOwnProperty.call(data, "is_sign") ||
            !Object.prototype.hasOwnProperty.call(data, "first_bind")) {
            console.error("malformed MihoyoCheckInData object in readMihoyoInfo, fetch may have failed", data);
            return null;
        }
        return data;
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
    if (!result ||
        !Object.prototype.hasOwnProperty.call(result, "retcode") ||
        !Object.prototype.hasOwnProperty.call(result, "message") ||
        !Object.prototype.hasOwnProperty.call(result, "data")) {
        console.error("malformed CheckInResult object in doSignIn, fetch may have failed", result);
        return;
    }
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

const DEBUG = 1;
const HOME_URL = DEBUG ? "http://localhost:3000/home" : "https://hk4e-api-os.mihoyo.com/event/sol/home?lang=en-us&act_id=e202102251931481";
const REFERER_URL = "https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=e202102251931481";
const ICON_LOOKUP = {
	"Adventurer's Experience":"/icons/reward-adv.png",
	"Bird Egg":"/icons/reward-egg.png",
	"Fine Enhancement Ore":"/icons/reward-ore.png",
	"Fish":"/icons/reward-fish.png",
	"Fowl":"/icons/reward-fowl.png",
	"Hero's Wit":"/icons/reward-hero.png",
	"Mora":"/icons/reward-mora.png",
	"Primogem":"/icons/reward-primo.png",
	"Raw Meat":"/icons/reward-meat.png",
};

console.log("popup opened", Date.now());

async function onPopupOpen(){
	const status:AppStatus = await sendMessage("get-status", null);
	if(!status){
		console.error("communication with background script failed");
		return;
	}
	if(status.lastResult === null) {
		console.error("no result to read");
	} else {
		console.debug(status);
		await displayInfo(status);
	}
}

async function sendMessage(event:InternalMessage, data: any){
	return browser.runtime.sendMessage({
		event: event,
		data: data
	});
}

async function displayInfo(status:AppStatus){
	const statusMessage = document.getElementById("status");
	const lastRun = document.getElementById("prev-check-in");
	const nextRun = document.getElementById("next-check-in");
	statusMessage.className = "";
	nextRun.className = "";
	lastRun.textContent = formatDate(status.lastRun);
	nextRun.textContent = formatCountdown(status.nextRun);
	if(nextRun.textContent === "not scheduled"){
		nextRun.classList.add("info-warn");
	}
	else if(nextRun.textContent === "in the past!"){
		nextRun.classList.add("info-err");
	}
	if(status.lastResult === "incomplete"){
		statusMessage.textContent = "In progress...";
		statusMessage.className = "info-warn";
	} else if(status.lastResult === "error") {
		statusMessage.textContent = "Error";
		statusMessage.className = "info-err";
		showReward(null,null,0);
	} else {
		if(status.lastResult.success){
			if(status.lastResult.checkinAttempted){
				statusMessage.textContent = "Successfully checked in!";
				statusMessage.className = "info-succ";
			} else {
				statusMessage.textContent = "Already checked in today...";
				statusMessage.className = "";
			}
			await getAndShowReward(status.lastResult.result.data);
		} else {
			statusMessage.textContent = "Check-in failed";
			statusMessage.className = "info-err";
			showReward(null,null,0);
			firstBind();
		}
	}
}

async function getAndShowReward(data:MihoyoCheckInData){
	const home:MihoyoHome = await fetch(HOME_URL)
		.then(e=>e.json())
		.catch(e=>console.log("error during fetch home",e));
	if(!home ||
		!Object.prototype.hasOwnProperty.call(home, "data") ||
		!Object.prototype.hasOwnProperty.call(home, "message") ||
		!Object.prototype.hasOwnProperty.call(home, "retcode")
	){
		console.error("malformed MihoyoHome object in getAndShowReward, fetch may have failed", home);
		showReward(null,null,0);
		return;
	}
	const i = data.total_sign_day -1;
	const reward = home?.data?.awards?.[i];
	const daysInMonth = home?.data?.awards?.length;
	showReward(data,reward, daysInMonth);
}

function formatDate(timestamp: number) {
	return new Date(timestamp).toLocaleString();
}

function formatCountdown(timestamp: number){
	if(timestamp === 0){
		return "not scheduled";
	}
	const diff = timestamp - Date.now();
	if(diff <= 0){
		return "in the past!";
	}
	const s = Math.trunc(diff/1000);
	const m = Math.trunc(s/60);
	const h = Math.trunc(m/60);
	return `${h}h ${m % 60}m ${s % 60}s`;
}

function firstBind(){
	const result = document.getElementById("result");
	const container = document.createElement("div");
	const notice = document.createElement("div");
	const link = document.createElement("a");
	notice.textContent = "You need to manually check in once before this tool can work.";
	link.textContent = "Go to Check-In page";
	link.href = REFERER_URL;
	container.append(notice);
	container.append(link);
	while(result.firstChild){
		result.firstChild.remove();
	}
	result.append(container);
}

function rewardImgFrame(reward: MihoyoReward, day:number, claimed:boolean, loading?:boolean) {
	const container = document.getElementById("checkin-frame");
	while(container.firstChild){
		container.firstChild.remove();
	}

	if(reward){
		const frame = document.createElement("img");
		frame.src = claimed? "/icons/frame-inactive.png" : "/icons/frame-active.png";
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
	else if(loading){
		const frame = document.createElement("img");
		frame.src = "/icons/frame-active.png";
		frame.classList.add("frame");
		const rewardDay = document.createElement("span");
		rewardDay.textContent = `Checking in...`;
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

function showReward(data:MihoyoCheckInData|null, reward:MihoyoReward|null, daysInMonth:number){
	const result = document.getElementById("result");
	while(result.firstChild){
		result.firstChild.remove();
	}
	const infoContainer = document.createElement("div");
	if(!data || !reward){
		rewardImgFrame(null,0,false);
		infoContainer.textContent = "Error: could not display check-in reward";
	}
	else {
		rewardImgFrame(reward, data.total_sign_day, data.is_sign);
		const checkInCount = document.createElement("div");
		checkInCount.textContent = `Total check-ins this month: ${data.total_sign_day}/${daysInMonth}`;
		infoContainer.append(checkInCount);
	}
	result.append(infoContainer);
}

document.getElementById("checkin-frame").addEventListener("click",function (){
	rewardImgFrame(null, 0, false, true);
	const statusBar = document.getElementById("status");
	statusBar.textContent = "In progress...";
	statusBar.className = "info-warn";
	Promise.all([
		browser.runtime.sendMessage({
			event: "manual-check-in",
			data: null
		}),
		new Promise(resolve => setTimeout(resolve,1000))
	]).then(e => displayInfo(e[0]))
		.catch(e => console.error("error sending manual check-in message",e));
})

onPopupOpen();

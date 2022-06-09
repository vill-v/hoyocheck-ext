type InternalMessage = "get-status" | "manual-check-in";

interface CheckInResult {
	success: boolean;
	checkinAttempted: boolean;
	nextRun: number;
	result: MihoyoInfo | null;
}

interface AppStatus{
	lastResult: CheckInResult | "error" | "incomplete" | null;
	lastRun: number;
	lastCheckin: number;
	nextRun: number;
}

interface MihoyoInfo{
	data: null | MihoyoCheckInData;
	message: string;
	retcode: -100 | 0;
}

interface MihoyoCheckInData{
	total_sign_day:number;
	today:string;
	is_sign:boolean;
	first_bind:boolean;
}

interface MihoyoHome{
	data: null | MihoyoRewardGallery;
	message: string;
	retcode: number;
}

interface MihoyoRewardGallery{
	month:number;
	awards:MihoyoReward[];
}

interface MihoyoReward{
	icon:string;
	name:string;
	cnt:number;
}

interface MihoyoCheckInResult {
	"retcode": 0 | -5003;
	"message": string;
	"data": MihoyoCheckInResultData;
}

interface MihoyoCheckInResultData {
	code: string;
}
type InternalMessages = "first-bind" | "show-reward" | "manual-check-in";

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

interface CheckInResult {
	"retcode": 0 | -5003;
	"message": string;
	"data": CheckInResultData;
}

interface CheckInResultData {
	code: string;
}
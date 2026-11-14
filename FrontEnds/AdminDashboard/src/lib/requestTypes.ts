import {TrainingPlan} from "@/lib/types";

export type UserRequestLoginType = {
    email: string;
    password: string;
}


export type AddCategoryRequestType = {
    categoryName: string;
    categoryImage: string;
}

export type AddTrainingPlanRequestType = {
    title:string;
    hourlyRate : number;
    totalHours : number;
    totalCost: number;
    description:string;
}
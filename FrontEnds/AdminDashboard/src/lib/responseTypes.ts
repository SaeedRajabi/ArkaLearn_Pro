import {TrainingPlan} from "@/lib/types";

export interface PagedData<T> {
    queryResult: {
        $values: T[];
    };
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    skipCount: number,
    needTotalCount:boolean,
    sortBy:string,
    sortAscending : boolean
}


export type UserLoginResponseType = {
   $id: string;
   userData:{
       id: string;
       name: string;
       userName:string;
       email: string;
       avatarUrl?: string;
       initials: string;
       status: 'ACTIVE' | 'BLOCKED';
       registrationDate: string;
       lastLogin: string;
       role: string;
       token:string;
   }

    // userData:{
    //     userId: string, // This would be set by the server on login
    //     fullName : string,
    //     userName: string,
    //     email : string,
    //     role: string,
    //     avatarUrl: string,
    //     token:string,
    //     registerDate: string,
    // }
}

export type ResponseMessageType = {
    action:string,
    title: string;
    description:string;
}


export type CourseAddedStringResponseType = {
    title: string;
    description:string
}

export type TrainingPlanResponseTypes = {

}
import type {Profile} from './model';
export type OwnProfile=Profile&{rulesVersion?:string;photoUploaded?:boolean;photoPending?:boolean};
export type ProfileForm=Omit<Profile,'id'|'age'>&{id?:string;age:number|string;confirmLocation?:boolean;locationSelectionToken?:string};
export type ReportTarget=Pick<Profile,'id'|'name'>&{reportType?:string;objectId?:string;scope?:string};
export type AccountStatus={status:string;notice?:string};
export type ReportReceipt={id:string;reason:string;status:string;resolution:string;created:string};

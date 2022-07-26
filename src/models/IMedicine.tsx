import IDose from "./IDose";

export default interface IMedicine { 
    id: string; 
    name: string;
    count: number;
    dose: number;
    doses: IDose[];
    lastDateTaken: Date;  
  }
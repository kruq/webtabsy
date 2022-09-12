import IDose from "./IDose";

export default interface IMedicine { 
    id: string; 
    name: string;
    count: number;
    isVisible: boolean;
    doses: IDose[];
  }
import IDose from "./models/IDose"
import IMedicine from "./models/IMedicine"

export interface IDoseWithDate extends IDose {
    date: Date,
    // canEdit: boolean
  }
  
export type DoseDetails = {
    medicine?: IMedicine,
    doseAmount: number,
    time: string,
    dose: IDoseWithDate
  }
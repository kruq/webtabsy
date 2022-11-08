import IDose from "./models/Dose"
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
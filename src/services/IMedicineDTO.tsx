import IDoseDTO from "./IDoseDTO";
import IPurchaseDTO from "./IPurchaseDTO";

export default interface IMedicineDTO {
  id: string;
  name: string;
  description: string;
  count: number;
  isVisible: boolean;
  doses: IDoseDTO[];
  purchases: IPurchaseDTO[];
}
import IDoseDTO from "./IDoseDTO";
import IPurchaseDTO from "./IPurchaseDTO";

export default interface IMedicineDTO {
  id: string;
  name: string;
  description: string;
  count: number;
  isVisible: boolean;
  hideWhenEmpty: boolean;
  doses: IDoseDTO[];
  purchases: IPurchaseDTO[];
}
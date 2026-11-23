import IDoseDTO from "./IDoseDTO";
import IPurchaseDTO from "./IPurchaseDTO";

export default interface IMedicineDTO {
  id: string;
  name: string;
  meal: string;
  description: string;
  count: number;
  isVisible: boolean;
  hideWhenEmpty: boolean;
  unitId?: string | null;
  asNeeded?: boolean;
  doses: IDoseDTO[];
  purchases: IPurchaseDTO[];
}
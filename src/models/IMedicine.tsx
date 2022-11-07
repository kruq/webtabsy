import Dose from "./Dose";
import IPurchase from "./IPurchase";

export default interface IMedicine {
  id: string;
  name: string;
  description: string;
  count: number;
  isVisible: boolean;
  doses: Dose[];
  purchases: IPurchase[];
}
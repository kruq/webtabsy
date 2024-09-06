import Dose from "./Dose";
import IPurchase from "./IPurchase";

export default interface IMedicine {
  id: string;
  name: string;
  description: string;
  count: number;
  isVisible: boolean;
  hideWhenEmpty: boolean;
  doses: Dose[];
  purchases: IPurchase[];
}
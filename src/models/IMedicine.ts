import Dose from "./Dose";
import IPurchase from "./IPurchase";

export default interface IMedicine {
  id: string;
  name: string;
  meal: string;
  description: string;
  count: number;
  isVisible: boolean;
  hideWhenEmpty: boolean;
  /** Lek doraźny - pokazywany w panelu leków doraźnych na zakładce Status, niezależnie od dawek. */
  asNeeded?: boolean;
  doses: Dose[];
  purchases: IPurchase[];
}
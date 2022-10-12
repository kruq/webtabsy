import IDose from "./IDose";
import IPurchase from "./IPurchase";

export default interface IMedicine {
  id: string;
  name: string;
  description: string;
  count: number;
  isVisible: boolean;
  doses: IDose[];
  purchases: IPurchase[];
}
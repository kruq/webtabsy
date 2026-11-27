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
  /** Id jednostki ze wspólnej listy; brak = tabletka. */
  unitId?: string | null;
  /** Lek doraźny - pokazywany w panelu leków doraźnych na zakładce Status, niezależnie od dawek. */
  asNeeded?: boolean;
  /** Tylko przypomnienie: dawki bez ilości, zapas (count) nie jest sprawdzany ani zmieniany. */
  ignoreQuantity?: boolean;
  /** „Kończy się” zaznaczone ręcznie - tylko dla leku bez kontroli ilości; zakup leku je zdejmuje. */
  runningOut?: boolean;
  /** Lek doraźny bez ostrzeżenia o kończącym się zapasie. */
  noLowStockWarning?: boolean;
  doses: Dose[];
  purchases: IPurchase[];
}
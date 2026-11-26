import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import IPurchase from '../models/IPurchase';
import { formatDate } from '../utils/dateFormat';
import { averagePackagePrice, formatPrice } from '../utils/purchases';
import Unit from '../models/Unit';
import { amountWithUnit, DEFAULT_UNIT } from '../utils/units';

interface PurchaseListProps {
    /** Jednostka leku; domyślnie tabletka. */
    unit?: Unit;
    /** Lek z „Ignoruj kontrolę ilości” - bez ilości w opakowaniu. */
    withoutQuantity?: boolean;
    purchases: IPurchase[];
    onRemove: (purchase: IPurchase) => void;
}

/**
 * Jeden wiersz na zakup: data, „2 op. × 30 tab.”, cena opakowania, cena wszystkich opakowań i „Usuń”.
 * Bez podanej ceny - „-”.
 */
export default function PurchaseList({ purchases, onRemove, unit = DEFAULT_UNIT, withoutQuantity = false }: PurchaseListProps) {
    if (!purchases || purchases.length === 0) return null;

    const sortedPurchases = [...purchases].sort((a, b) => b.date.getTime() - a.date.getTime());
    const average = averagePackagePrice(purchases);

    return (
        <Row>
            <Col>
                {/* Każdy zakup w jednej linii (bez zawijania); mniejszy tekst, żeby zmieścił się też na telefonie. */}
                <Table size="sm" className="align-middle text-nowrap small">
                    <tbody>
                        {sortedPurchases.map(p => (
                            <tr key={`medicine-purchase-${p.id}`}>
                                <td>{formatDate(p.date)}</td>
                                <td>
                                    {p.packages} op.{!withoutQuantity && ` × ${amountWithUnit(p.numberOfTablets, unit)}`}
                                </td>
                                <td className="text-end">{p.price !== undefined ? `${formatPrice(p.price)}/op.` : '-'}</td>
                                <td className="text-end">{p.totalPrice !== undefined ? formatPrice(p.totalPrice) : '-'}</td>
                                <td className="text-end">
                                    <Button onClick={() => onRemove(p)} variant="link" size="sm" className="text-danger p-0">
                                        Usuń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <i>Średnia cena: </i>{average !== undefined ? formatPrice(average) : '-'}
            </Col>
        </Row>
    );
}

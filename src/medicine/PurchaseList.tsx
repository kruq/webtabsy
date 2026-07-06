import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import IPurchase from '../models/IPurchase';

interface PurchaseListProps {
    purchases: IPurchase[];
    onRemove: (purchase: IPurchase) => void;
}

function averagePrice(purchases: IPurchase[]): number {
    const withPrice = purchases.filter(x => x.price !== null && x.price !== undefined);
    if (withPrice.length === 0) return 0;
    const sum = withPrice.reduce((acc, p) => acc + (p.price ?? 0), 0);
    return Math.round((sum * 100) / withPrice.length) / 100;
}

export default function PurchaseList({ purchases, onRemove }: PurchaseListProps) {
    if (!purchases || purchases.length === 0) return null;

    const sortedPurchases = [...purchases].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Row>
            <Col>
                <Table size="sm">
                    <tbody>
                        {sortedPurchases.map(p => (
                            <tr key={`medicine-purchase-${p.id}`}>
                                <td width="20%">{p.numberOfTablets} tab.</td>
                                <td width="20%">
                                    {p.price !== undefined ? `${p.price} zł` : '-'}
                                </td>
                                <td>{p.date.toLocaleDateString('pl')}</td>
                                <td className="text-end">
                                    <Button onClick={() => onRemove(p)} variant="link" className="text-danger my-0">
                                        Usuń
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <i>Średnia cena: </i>{averagePrice(purchases)} zł
            </Col>
        </Row>
    );
}

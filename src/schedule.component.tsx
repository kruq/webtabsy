import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import IMedicine from "./models/IMedicine";
import _ from 'lodash';
import { getDateText, getDaysText } from './text.helpers';

interface IScheduleProps {
    medicines: IMedicine[];
}

export default function Schedule(props: IScheduleProps) {
    return <>
        <Row>
            <Col className="d-flex flex-column align-items-center">
                {Object.entries(_.groupBy(
                    props.medicines
                        .filter(m => m.doses.length > 0)
                        .map(m => {
                            return m.doses
                                .filter(d => (() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0);
                                    // console.log(d.endDate, d.nextDoseDate, today);
                                    return (d.endDate === null || new Date() <= d.endDate) && (d.nextDoseDate >= today);
                                })())
                                .map(d => { return { dose: d, name: m.name }; });
                        })
                        .flatMap(x => x),
                    x => x.dose.time
                ))
                    .sort((x, y) => x > y ? 1 : -1)
                    .map(x =>
                        <Row className="w-100">
                            <Col xs="auto" className="d-flex align-items-center">
                                <strong className="text-secondary">{x[0]}</strong>
                            </Col>
                            <Col>
                                <Card className='my-2' key={'schedule-' + x[1][0].dose.id}>
                                    <Card.Body>
                                        {x[1].sort((y, z) => y.name > z.name ? 1 : -1).map(y => <Row key={'schedule-dose-' + y.dose.id}>
                                            <Col md={4} xs={12}>
                                                <strong>{y.dose.amount}{' x '}{y.name}</strong>
                                            </Col>
                                            <Col md={4} xs={12}>
                                                <small>co {getDaysText(y.dose.numberOfDays)}</small>
                                            </Col>
                                            <Col md={4} xs={12}>
                                                <small>następny {getDateText(y.dose.nextDoseDate)}</small>
                                            </Col>
                                        </Row>)}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
            </Col>
        </Row >
    </>

}
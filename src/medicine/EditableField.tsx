import React, { ReactNode } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { TfiCheck, TfiPencil } from 'react-icons/tfi';

interface EditableFieldProps {
    label: string;
    isEditing: boolean;
    onStartEdit: () => void;
    onStopEdit: () => void;
    children: ReactNode;
    display: ReactNode;
}

export default function EditableField({ label, isEditing, onStartEdit, onStopEdit, children, display }: EditableFieldProps) {
    return (
        <Form.Group className="mb-3">
            <Row>
                <Col>
                    <small className="text-secondary">{label}:</small>
                </Col>
                <Col xs="auto">
                    {!isEditing && (
                        <Button onClick={onStartEdit} variant="link"><TfiPencil /></Button>
                    )}
                    {isEditing && (
                        <Button onClick={onStopEdit} variant="link"><TfiCheck /></Button>
                    )}
                </Col>
            </Row>
            <Row>
                {!isEditing && <Col>{display}</Col>}
                {isEditing && <Col>{children}</Col>}
            </Row>
        </Form.Group>
    );
}

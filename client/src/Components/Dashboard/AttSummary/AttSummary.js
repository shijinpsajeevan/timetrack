import React from 'react';
import { Layout, Menu, Breadcrumb, Table, Statistic, Card, Row, Col, Button, theme, Space , Typography} from 'antd';

const style: React.CSSProperties = { background: '#0092ff', padding: '8px 0' };

const { Title, Paragraph, Text, Link } = Typography;

export default function AttSummary() {
    return (
        <>
            <Row gutter={[16, 16]}>
                <Col className="gutter-row" span={24}>
                    <div>
                        <Typography>
                            <Title level={4}>Attendance Summary</Title>
                        </Typography>
                    </div>
                </Col>
                <Col className="gutter-row" span={6}>
                    <div style={style}>col-6</div>
                </Col>
                <Col className="gutter-row" span={6}>
                    <div style={style}>col-6</div>
                </Col>
                <Col className="gutter-row" span={6}>
                    <div style={style}>col-6</div>
                </Col>
            </Row>
        </>
    )
}

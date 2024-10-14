import React from 'react';
import { Layout, Menu, Breadcrumb, Table, Statistic, Card, Row, Col, Button, theme, Space } from 'antd';

export default function Users() {
    return (
        <>
        <Row gutter={[16, 16]}>
            <Col span={8}>
                <Card>
                    <Statistic title="Total Employees" value={50} />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic title="Present Today" value={45} />
                </Card>
            </Col>
            <Col span={8}>
                <Card>
                    <Statistic title="Absent Today" value={5} />
                </Card>
            </Col>
        </Row> 
        {/* <Table columns={columns} dataSource={data} style={{ marginTop: '16px' }} />  */}
    </ >
  )
}

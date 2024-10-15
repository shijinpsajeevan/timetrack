import React, { useState } from 'react';
import { ProfileOutlined, RightCircleOutlined, SearchOutlined, CalendarTwoTone } from '@ant-design/icons';
import { Row, Col, Space, Typography, Form, Select, DatePicker, Radio, Button, Flex, Segmented } from 'antd';

const style: React.CSSProperties = { padding: '4px 0' };

const { Title } = Typography;

export default function AttSummary() {
    const [value, setValue] = useState(1); // For Radio selection

    const [loadings, setLoadings] = useState([]);

    const onTemplateChange = (e) => {
        setValue(e);

    };

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <div style={style}>
                        <Typography style={{ textAlign: 'left' }}>
                            <Space size={'small'}>
                                <Title level={5}><ProfileOutlined />  Attendance Summary</Title>
                            </Space>
                        </Typography>
                    </div>
                </Col>
                <Col className="gutter-row" span={24}>
                    <Flex justify='space-between' style={{ width: '100%' }} gap="middle" vertical>
                        <Form layout='inline'>
                            <Form.Item label={<span style={{ fontSize: '16px' }}><RightCircleOutlined /> Location</span>} style={{ width: '350px' }}>
                                <Select
                                    size='middle'
                                    showSearch
                                    placeholder="Select Location"
                                    optionFilterProp="label"
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                    }
                                    options={[
                                        { value: '1', label: 'Not Identified' },
                                        { value: '2', label: 'Closed' },
                                        { value: '3', label: 'Communicated' },
                                        { value: '4', label: 'Identified' },
                                        { value: '5', label: 'Resolved' },
                                        { value: '6', label: 'Cancelled' },
                                    ]}
                                />
                            </Form.Item>

                            {/* <Form.Item label={<span style={{ fontSize: '16px' }}><RightCircleOutlined /> Template</span>}>
                                <Radio.Group onChange={onTemplateChange} value={value} optionType="button" buttonStyle="solid">
                                    <Radio value={1}>Daily Report</Radio>
                                    <Radio value={2}>Weekly Report</Radio>
                                    <Radio value={3}>Monthly Report</Radio>
                                </Radio.Group>
                            </Form.Item> */}

                            <Form.Item label={<span style={{ fontSize: '16px' }}><RightCircleOutlined /> Template</span>}>
                                <Segmented onChange={onTemplateChange}
                                    options={[
                                        {
                                            label: 'Daily',
                                            value: 1,
                                            icon: <CalendarTwoTone />,
                                        },
                                        {
                                            label: 'Weekly',
                                            value: 2,
                                            icon: <CalendarTwoTone />,
                                        },
                                        {
                                            label:'Monthly',
                                            value: 3,
                                            icon: <CalendarTwoTone/>
                                        }
                                    ]}
                                />
                            </Form.Item>


                            <Form.Item label={<span style={{ fontSize: '16px' }}><RightCircleOutlined /> Date Range</span>}>
                                <Space>
                                    {value === 1 && <DatePicker placeholder="Select Date" />}
                                    {value === 2 && <DatePicker placeholder="Select Week" picker="week" />}
                                    {value === 3 && <DatePicker placeholder="Select Month" picker="month" />}
                                </Space>
                            </Form.Item>

                            <Button type="dashed" shape="circle" icon={<SearchOutlined />}>

                            </Button>

                        </Form>
                    </Flex>

                </Col>
            </Row>
        </>
    );
}

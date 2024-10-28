import React, { useState, useEffect } from 'react';
import { ProfileOutlined, RightCircleOutlined, SearchOutlined, CalendarTwoTone, EnvironmentFilled, LayoutFilled, ClockCircleFilled } from '@ant-design/icons';
import { Row, Col, Space, Typography, Form, Select, DatePicker, Radio, Button, Flex, Segmented, Card, message } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import AttMonthly from './AttSummaryTemplate/AttMonthly';


dayjs.extend(isoWeek);

const style = { padding: '4px 0' };
const { Title } = Typography;
const dateFormat = 'DD/MM/YYYY';
const monthFormat = 'MM/YYYY';

export default function AttSummary() {

    const [locationList, setLocationList] = useState([]);
    const [form] = Form.useForm();
    const [templateValue, setTemplateValue] = useState(3);
    const [locationId, setLocationId] = useState(null); // For Radio selection
    const [loadings, setLoadings] = useState([]);
    const [dateRange, setDateRange] = useState(null);

    const generateReport = (values) => {
        let formattedDate;
        if (values.dateRange) {
            if (templateValue === 1) {
                // formattedDate = values.dateRange.format('YYYY-MM-DD');
                formattedDate = values.dateRange.toDate();
            } else if (templateValue === 2) {
                // formattedDate = values.dateRange.format('YYYY-[W]WW');
                formattedDate = values.dateRange.startOf('week').toDate(); 
            } else if (templateValue === 3) {
                // formattedDate = values.dateRange.format('YYYY-MM');
                formattedDate = values.dateRange.startOf('month').toDate();
            }
        }

        console.log('Form submitted with values:', {
            ...values,
            dateRange: formattedDate
        });

        // Here you can make your API call with the formatted values
        setLocationId(values.devicelocation);
        setDateRange(formattedDate);
    };

     // State for locations

    const handleDateChange = (date, dateString) => {
        form.setFieldsValue({ dateRange: date });
    }

    const disableFutureDates = (current) => {
        // Disable dates after today
        return current && current > dayjs().endOf('day');
    };


    useEffect(() => {

        fetchLocations();

    }, [])


    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.post('http://localhost:3003/api/common/getDeviceList', {}, {
                headers: { token: token }
            });

            // Replace with your API URL
            const locations = response.data.map(location => ({
                value: location.DeviceId, // 
                label: location.DeviceFName //
            }));
            setLocationList(locations);
        } catch (error) {
            message.error("Failed to Load Location")
            console.error("Failed to fetch locations:", error);
        }
    };



    

    const onTemplateChange = (e) => {
        setTemplateValue(e);
        setDateRange(null);
        form.setFieldsValue({ dateRange: null }); // Reset the dateRange upon template change
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
                    <Flex justify='space-between' style={{ width: '100%' }} gap="middle" vertical >
                        <Form form={form} layout='inline' onFinish={generateReport} initialValues={{ template: templateValue }} requiredMark={false}>
                            <Form.Item label={<span style={{ fontSize: '16px' }}><EnvironmentFilled /> Location</span>} style={{ width: '350px' }} name="devicelocation" rules={[{ required: true, message: 'Please select a location!' }]}>
                                <Select
                                    size='middle'
                                    showSearch
                                    placeholder="Select Location"
                                    optionFilterProp="label"
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                    }
                                    options={locationList}
                                />
                            </Form.Item>


                            <Form.Item label={<span style={{ fontSize: '16px' }}><LayoutFilled /> Template</span>} name="template">
                                <Segmented onChange={onTemplateChange} value={templateValue}
                                    options={[
                                        {
                                            label: 'Daily',
                                            value: 1,
                                            icon: <CalendarTwoTone />,
                                        },
                                        // {
                                        //     label: 'Weekly',
                                        //     value: 2,
                                        //     icon: <CalendarTwoTone />,
                                        // },
                                        {
                                            label: 'Monthly',
                                            value: 3,
                                            icon: <CalendarTwoTone />
                                        }
                                    ]}
                                />
                            </Form.Item>


                            <Form.Item label={<span style={{ fontSize: '16px' }}><ClockCircleFilled /> Date Range</span>} name="dateRange" rules={[{ required: true, message: 'Please select a date range!' }]} >
                                <Space>
                                    {templateValue === 1 && <DatePicker placeholder="Select Date" format={dateFormat} onChange={handleDateChange} disabledDate={disableFutureDates} />}
                                    {templateValue === 2 && <DatePicker placeholder="Select Week" picker="week" onChange={handleDateChange} />}
                                    {templateValue === 3 && <DatePicker placeholder="Select Month" picker="month" format={monthFormat} onChange={handleDateChange} disabledDate={disableFutureDates} />}
                                </Space>
                            </Form.Item>

                            <Button type="primary" htmlType="submit" shape="circle" icon={<SearchOutlined />}>

                            </Button>

                        </Form>
                    </Flex>

                </Col>
                {templateValue===3 ? <AttMonthly locationid={locationId} duration={dateRange}/>:<></>}
            </Row>
        </>
    );
}

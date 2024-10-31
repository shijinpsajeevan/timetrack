import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Button,
  Table,
  Space,
  message,
  Form,
  Switch,
  Divider
} from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const Regularize = () => {
  const [form] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [locationlist, setLocationList] = useState([]);
  const [employeelist, setEmployeelist] = useState([]);
  const [regularizedData, setRegularizedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch locations and employees on component mount
  useEffect(() => {
    fetchLocations();
    fetchEmployees();
  }, []);

  // Update filtered data when regularizedData changes
  useEffect(() => {
    setFilteredData(regularizedData);
  }, [regularizedData]);

  const disabledDate = (current) => {
    const startDate = form.getFieldValue('dateRange')?.[0];
    const today = dayjs();
  
    if (current && current.isAfter(today, 'day')) {
      return true;
    }
    
    if (startDate) {
      const startMonth = startDate.startOf('month');
      const endMonth = startDate.endOf('month');
      return current < startMonth || current > endMonth;
    }
    
    return false;
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://azzurro.dyndns.org:3001/api/common/getDeviceList', {}, {
        headers: { token: token }
      });
      const locations = response.data.map(location => ({
        value: location.DeviceId,
        label: location.DeviceFName
      }));
      setLocationList(locations);
    } catch (error) {
      message.error("Failed to Load Location");
      console.error("Failed to fetch locations:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://azzurro.dyndns.org:3001/api/common/getEmployeeList', {
        headers: {
          'token': localStorage.getItem('token')
        }
      });
      const data = response.data;
      setEmployeelist(data);
    } catch (error) {
      message.error('Failed to fetch employees');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await fetch('http://azzurro.dyndns.org:3001/api/common/regularize-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          locationId: values.location,
          employeeIds: values.employees,
          startDate: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
          endDate: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
          remarks: values.remarks,
          direction: values.direction ? 'in' : 'out'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRegularizedData(prevData => [...prevData, ...data.records]);
        message.success('Attendance regularized successfully');
        form.resetFields();
      } else {
        message.error(data.message || 'Failed to regularize attendance');
      }
    } catch (error) {
      message.error('Failed to regularize attendance');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await fetch(
        `http://azzurro.dyndns.org:3001/api/common/regularize-attendance/${record.id}?tableName=${record.tableName}`, 
        {
          method: 'DELETE',
          headers: {
            'token': localStorage.getItem('token')
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setRegularizedData(prevData => 
          prevData.filter(item => item.id !== record.id)
        );
        message.success('Record deleted successfully');
      } else {
        message.error(data.message || 'Failed to delete record');
      }
    } catch (error) {
      message.error('Failed to delete record');
      console.error('Error:', error);
    }
  };

  const fetchRegularizedReport = async (values) => {
    try {
      setReportLoading(true);
      const monthYear = values.monthYear.format('YYYY-M');
      const [year, month] = monthYear.split('-');
      const tableName = `DeviceLogs_${month}_${year}`;
      
      const response = await fetch(
        `http://azzurro.dyndns.org:3001/api/common/regularize-attendance/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': localStorage.getItem('token')
          },
          body: JSON.stringify({
            locationId: values.location,
            tableName
          })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setRegularizedData(data.records);
      } else {
        message.error('Failed to fetch report');
      }
    } catch (error) {
      message.error('Failed to fetch report');
      console.error('Error:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleResetTable = () => {
    setRegularizedData([]);
    setFilteredData([]);
    reportForm.resetFields();
  };

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      filteredValue: filteredData.map(item => item.employeeName),
      filterSearch: true,
      filters: [...new Set(regularizedData.map(item => item.employeeName))].map(name => ({
        text: name,
        value: name
      })),
      onFilter: (value, record) => record.employeeName === value,
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      filteredValue: filteredData.map(item => item.locationName),
      filterSearch: true,
      filters: [...new Set(regularizedData.map(item => item.locationName))].map(name => ({
        text: name,
        value: name
      })),
      onFilter: (value, record) => record.locationName === value,
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      filters: [
        { text: 'in', value: 'in' },
        { text: 'out', value: 'out' }
      ],
      onFilter: (value, record) => record.direction === value,
    },
    {
      title: 'Date',
      dataIndex: 'Date',
      key: 'Date',
      sorter: (a, b) => new Date(a.Date) - new Date(b.Date),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Attendance Regularization Form">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true, message: 'Please select location' }]}
                  >
                    <Select
                      placeholder="Select location"
                      options={locationlist}
                      showSearch
                      filterOption={(input, option) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="employees"
                    label="Employees"
                    rules={[{ required: true, message: 'Please select employees' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select employees"
                      options={employeelist.map(emp => ({
                        label: `${emp.EmployeeName} (${emp.EmployeeCode})`,
                        value: emp.EmployeeCode,
                      }))}
                      showSearch
                      filterOption={(input, option) => {
                        const searchText = input.toLowerCase();
                        const employeeData = employeelist.find(emp => emp.EmployeeCode === option.value);
                        return (
                          employeeData.EmployeeName.toLowerCase().includes(searchText) ||
                          employeeData.EmployeeCode.toString().toLowerCase().includes(searchText)
                        );
                      }}
                      optionFilterProp="children"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="dateRange"
                    label="Date Range"
                    rules={[{ required: true, message: 'Please select date range' }]}
                  >
                    <RangePicker
                      showTime
                      style={{ width: '100%' }}
                      disabledDate={disabledDate}
                      onChange={(dates) => {
                        if (dates && dates[0]) {
                          form.setFieldsValue({
                            dateRange: [dates[0], dates[1]]
                          });
                        }
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="remarks"
                    label="Remarks"
                    rules={[{ required: true, message: 'Please enter remarks' }]}
                  >
                    <TextArea rows={1} />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item
                    name="direction"
                    label="Direction"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch
                      checkedChildren="in"
                      unCheckedChildren="out"
                      defaultChecked
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Regularized Attendance Report">
            <Form
              form={reportForm}
              layout="horizontal"
              onFinish={fetchRegularizedReport}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="location"
                    label="Location"
                    rules={[{ required: true, message: 'Please select location' }]}
                  >
                    <Select
                      placeholder="Select location"
                      options={locationlist}
                      showSearch
                      filterOption={(input, option) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="monthYear"
                    label="Month & Year"
                    rules={[{ required: true, message: 'Please select month and year' }]}
                  >
                    <DatePicker 
                      picker="month" 
                      style={{ width: '100%' }}
                      disabledDate={current => current && current.isAfter(dayjs(), 'month')}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={reportLoading}>
                      Fetch Report
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={handleResetTable}
                    >
                      Reset
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              onChange={(pagination, filters, sorter) => {
                
              }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Regularize;
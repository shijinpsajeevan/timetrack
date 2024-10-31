import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Table, 
  Space, 
  message,
  Card
} from 'antd';
import { 
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const { Option } = Select;

const DesignationReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locationList, setLocationList] = useState([]);
  const [reportData, setReportData] = useState([]);
  
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://azzurro.dyndns.org:3001/api/common/getDeviceList', {}, {
        headers: { token }
      });
      const locations = response.data.map(location => ({
        value: location.DeviceId,
        label: location.DeviceFName
      }));
      setLocationList(locations);
    } catch (error) {
      message.error("Failed to Load Locations");
    }
  };

  const getTableName = (month, year) => {
    return `Devicelogs_${month}_${year}`;
  };

  const processAttendanceData = (rawData, selectedDate) => {
    // Get all unique designations from the data
    const designations = [...new Set(rawData.map(record => record.Designation))].filter(Boolean);
    
    const dateMap = {};
    const startOfMonth = selectedDate.startOf('month');
    const daysInMonth = selectedDate.daysInMonth();
    
    // Initialize all dates in the month
    for (let day = 0; day < daysInMonth; day++) {
      const currentDate = startOfMonth.add(day, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayName = currentDate.format('dddd');
      
      dateMap[dateStr] = {
        date: dateStr,
        day: dayName,
        // Initialize with empty Sets to track unique employees per designation
        employeeSets: designations.reduce((acc, designation) => ({
          ...acc,
          [designation]: new Set()
        }), {}),
        ...designations.reduce((acc, designation) => ({
          ...acc,
          [designation]: 0
        }), {}),
        total: 0
      };
    }
  
    // Group records by date and count unique employees per designation
    rawData.forEach(record => {
      if (!record.Designation || !record.EmployeeCode) {
        console.log('Skipping record - missing data:', record);
        return;
      }
  
      // Get just the date part from the LogDate
      const recordDate = dayjs(record.LogDate).format('YYYY-MM-DD');
      
      if (dateMap[recordDate]) {
        // Add employee to the appropriate designation set
        dateMap[recordDate].employeeSets[record.Designation].add(record.EmployeeCode);
      }
    });
  
    // Convert Sets to counts and calculate totals
    Object.keys(dateMap).forEach(dateStr => {
      const dateRecord = dateMap[dateStr];
      let dailyTotal = 0;
  
      // Convert each Set size to a count
      designations.forEach(designation => {
        const uniqueCount = dateRecord.employeeSets[designation].size;
        dateRecord[designation] = uniqueCount;
        dailyTotal += uniqueCount;
      });
  
      dateRecord.total = dailyTotal;
      // Clean up the employeeSets as we don't need them in the final output
      delete dateRecord.employeeSets;
    });
  
    return {
      designations,
      data: Object.values(dateMap)
    };
  };

  const handleGenerate = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const selectedDate = dayjs(values.month);
      const month = selectedDate.month() + 1;
      const year = selectedDate.year();
      const tableName = getTableName(month, year);

      const responses = await Promise.all(values.locations.map(locationId => 
        axios.post('http://azzurro.dyndns.org:3001/api/common/getDeviceLogs', {
          locationId,
          tableName,
          type: 3
        }, {
          headers: { token }
        })
      ));

      const allData = responses.flatMap(response => response.data);
      const { designations, data } = processAttendanceData(allData, selectedDate);
      
      const columns = [
        {
          title: 'Date',
          dataIndex: 'date',
          key: 'date',
          fixed: 'left',
          render: (text) => dayjs(text).format('DD/MM/YYYY')
        },
        {
          title: 'Day',
          dataIndex: 'day',
          key: 'day',
          fixed: 'left'
        },
        ...designations.map(designation => ({
          title: designation,
          dataIndex: designation,
          key: designation,
          align: 'center'
        })),
        {
          title: 'Total',
          dataIndex: 'total',
          key: 'total',
          fixed: 'right',
          align: 'center'
        }
      ];

      setReportData({
        columns,
        data
      });
    } catch (error) {
      message.error("Failed to generate report");
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData.data?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Designation Report');

    worksheet.columns = reportData.columns.map(col => ({
      header: col.title,
      key: col.dataIndex,
      width: 15
    }));

    worksheet.addRows(reportData.data);
    worksheet.getRow(1).font = { bold: true };
    
    const totals = reportData.columns.map(col => {
      if (col.dataIndex === 'date') return 'Total';
      if (col.dataIndex === 'day') return '';
      return reportData.data.reduce((sum, row) => sum + (row[col.dataIndex] || 0), 0);
    });
    worksheet.addRow(totals);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'designation_report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Form.Item
            name="locations"
            label="Select Locations"
            rules={[{ required: true, message: 'Please select locations' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select locations"
              style={{ width: '100%' }}
            >
              {locationList.map(location => (
                <Option key={location.value} value={location.value}>
                  {location.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="month"
            label="Select Month"
            rules={[{ required: true, message: 'Please select month' }]}
          >
            <DatePicker.MonthPicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Generate Report
            </Button>
          </Form.Item>
        </div>
      </Form>

      {reportData.data?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Space style={{ marginBottom: '16px' }}>
            <Button 
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
            >
              Export to Excel
            </Button>
          </Space>

          <Table
            columns={reportData.columns}
            dataSource={reportData.data}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowKey="date"
            summary={pageData => {
              if (!pageData.length) return null;
              
              const totals = reportData.columns.map(col => {
                if (col.dataIndex === 'date') return 'Total';
                if (col.dataIndex === 'day') return '';
                return pageData.reduce((sum, row) => sum + (row[col.dataIndex] || 0), 0);
              });

              return (
                <Table.Summary.Row>
                  {totals.map((value, index) => (
                    <Table.Summary.Cell 
                      key={index}
                      index={index}
                      align={index > 1 ? 'center' : 'left'}
                    >
                      <strong>{value}</strong>
                    </Table.Summary.Cell>
                  ))}
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default DesignationReport;
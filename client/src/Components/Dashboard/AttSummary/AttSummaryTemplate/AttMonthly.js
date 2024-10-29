import React, { useState, useEffect } from 'react';
import { Col, Card, Row, Empty, message, Button, Table, Space, Input, Typography, Select, Tag, Divider, Modal  } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined, FileExcelOutlined, FilePdfOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo1 from '../../../../Images/azzurro.jpg'
import logo2 from '../../../../Images/ESELogo.png'
import {logo1str} from '../../../../Images/azzurro64'
import {logo2str} from '../../../../Images/ESELogo64'
const { Title, Text } = Typography;
const { Option } = Select;

export default function AttMonthly({ locationid, duration }) {
    const firstName = localStorage.getItem('userName');
    const lastName = localStorage.getItem('lastName');
    const designation = localStorage.getItem('designation');
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [activeFilters, setActiveFilters] = useState({});
    const [remarks, setRemarks] = useState({});
    const [locationName, setLocationName] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [contractType, setContractType] = useState(2); // Default to automated count
    const [staffCount, setStaffCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [filteredStaffCount, setFilteredStaffCount] = useState(null);
    const [filteredTotalCount, setFilteredTotalCount] = useState(null);

    const abortController = new AbortController();

    
    useEffect(() => {
        const fetchData = async () => {
            clearAllFilters()
            if (locationid && duration && contractType) {
                setLoading(true);
                try {
                    // Fetch all data in parallel
                    await Promise.all([
                        fetchLogs(locationid, duration),
                        fetchLocationName(locationid),
                        fetchHolidays(duration)
                    ]);
                } catch (error) {
                    console.error("Error initializing data:", error);
                    message.error("Failed to initialize data");
                } finally {
                    setLoading(false);
                }
            } else {
                console.log("Props not passed down to AttMonthly due to null value or incorrect selection");
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };
    }, [locationid, duration, contractType]); // Remove logs and filteredData from dependencies

    // Second useEffect for calculations
    useEffect(() => {
        if (!loading && logs.length > 0) {
            calculateStaffCount();
            updateFilteredCounts();
        }
    }, [logs, filteredData, contractType, loading]);

   
    const clearAllFilters = () => {
        setActiveFilters({});
        setFilteredData([]);
    };

    const calculateWorkingDays = (employeeData) => {
        console.log(employeeData,"for wokringdyacalc");
        
        if (!employeeData || employeeData.isSummary || employeeData.isTotal || employeeData.totalPresent || !employeeData.EmployeeCode) return 0;
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        let workingDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const status = employeeData[`day${day}`];
            // Only count days that are not PH, SL, or WO
            if (status !== 'PH' && status !== 'SL' && status !== 'WO') {
                workingDays++;
            console.log(workingDays);
            
            }
        }
        return workingDays;
    };

    const calculateStaffCount = async () => {
        try {
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();

            switch (contractType) {
                case 1: // Automated Count
                const allData = getCurrentData().filter(record => !record.isTotal && !record.isSummary);

                    const staffCount = allData.length;
                    setStaffCount(staffCount);

                    // Calculate total count excluding PH, SL, and WO days for each employee
                    const totalWorkingDays = allData.reduce((sum, employee) => {
                        return sum + calculateWorkingDays(employee);
                    }, 0);

                    setTotalCount(totalWorkingDays);
                    break;

                case 2: // Daily Contract
                case 3: // Monthly Contract
                    const type = contractType === 2 ? 'Daily' : 'Monthly';
                    const response = await axios.get('http://localhost:3003/api/common/getContractCount', {
                        params: {
                            locationId: locationid,
                            date: duration.toISOString(),
                            contractType: type
                        },
                        headers: {
                            'token': localStorage.getItem('token')
                        }
                    });

                    if (response.data.success) {
                        const count = response.data.count;
                        setStaffCount(count);

                        // For daily/monthly contracts, calculate working days excluding PH, SL, WO
                        const currentData = getCurrentData().filter(record => !record.isTotal && !record.isSummary);
                        const avgWorkingDays = currentData.length > 0
                            ? Math.floor(currentData.reduce((sum, employee) =>
                                sum + calculateWorkingDays(employee), 0) / currentData.length)
                            : 0;

                        setTotalCount(type === 'Daily' ? count * avgWorkingDays : count);
                    } else {
                        message.error("Failed to fetch contract count");
                    }
                    break;
            }

            updateFilteredCounts();
        } catch (error) {
            console.error("Error calculating staff count:", error);
            message.error("Failed to calculate staff count");
        }
    };

    const updateFilteredCounts = () => {
        const currentData = getCurrentData().filter(record => !record.isTotal);

        if (isDataFiltered()) {
            const filteredCount = currentData.length;
            setFilteredStaffCount(filteredCount);

            // Calculate filtered total count excluding PH, SL, and WO
            const filteredWorkingDays = currentData.reduce((sum, employee) => {
                return sum + calculateWorkingDays(employee);
            }, 0);

            setFilteredTotalCount(
                contractType === 3 ? filteredCount : filteredWorkingDays
            );
        } else {
            setFilteredStaffCount(null);
            setFilteredTotalCount(null);
        }
    };

    const renderContractSummary = () => {
        const contractTypes = {
            1: "Automated Count",
            2: "Daily Contract",
            3: "Monthly Contract"
        };

        return (
            <div>
                <Space direction="horizontal" size="middle">
                    {/* <Text><strong>Contract Type:</strong> {contractTypes[contractType]}</Text> */}
                    <Text>
                        <strong>
                            <Tag color="green">Employee Count <b>{staffCount}</b></Tag></strong>
                        {/* {filteredStaffCount !== null && (
                            <span className="text-gray-500 ml-2">
                                (Filtered: {filteredStaffCount})
                            </span>
                        )} */}
                    </Text>
                    <Text>
                            
                        <strong>
                        <Tag color="blue">Total Count for Month <b>{totalCount}</b></Tag></strong> 
                        {/* {filteredTotalCount !== null && (
                            <span className="text-gray-500 ml-2">
                                (Filtered: {filteredTotalCount})
                            </span>
                        )} */}
                    </Text>
                    <Divider/>
                </Space>
              </div>
            
        );
    };


    // Add contract type selector in the existing render method
    const renderControls = () => (
        <Space size="middle" className="mb-4">
            <Select
                value={contractType}
                onChange={(value) => {
                    setContractType(value);
                    setFilteredStaffCount(null);
                    setFilteredTotalCount(null);
                }}
                style={{ width: 200 }}
            >
                <Option value={1}>Automated Count</Option>
                <Option value={2}>Daily Contract</Option>
                <Option value={3}>Monthly Contract</Option>
            </Select>
            <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                loading={exportLoading}
            >
                Export to Excel
            </Button>
            <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={exportToPdf}
                loading={exportLoading}
            >
                Export to PDF
            </Button>
            {isDataFiltered() && (
                <Button
                    icon={<ClearOutlined />}
                    onClick={() => {
                        clearAllFilters();
                        setFilteredStaffCount(null);
                        setFilteredTotalCount(null);
                    }}
                >
                    Clear All Filters
                </Button>
            )}
        </Space>
    );

    const calculateTotalPresent = (record) => {
        if (!record || record.isTotal) return '';  // Skip calculation for summary row
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        let total = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            if (record[`day${day}`] === 'P' || record[`day${day}`] === 'ME') {
                total++;
            }
        }
        return total;
    };


    const isDataFiltered = () => {
        return Object.values(activeFilters).some(filter => filter && filter.length > 0);
    };

    const calculateOverallTotals = (data) => {
        // Filter out the summary row before calculating totals
        const regularData = data.filter(record => !record.isTotal);

        let totalPresent = 0;
        let totalME = 0;

        regularData.forEach(record => {
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                if (record[`day${day}`] === 'P') {
                    totalPresent++;
                } else if (record[`day${day}`] === 'ME') {
                    totalME++;
                }
            }
        });

        return {
            totalPresent,
            totalME,
            grandTotal: totalPresent + totalME
        };
    };


    const calculateDailyTotals = (data) => {

        const regularData = data.filter(record => !record.isTotal && record);

        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        const totals = {
            dailyPresent: Array(daysInMonth).fill(0),
            dailyME: Array(daysInMonth).fill(0),
            totalPresent: 0,
            totalME: 0
        };

        regularData.forEach(record => {
            for (let day = 1; day <= daysInMonth; day++) {
                const status = record[`day${day}`];
                if (status === 'P') {
                    totals.dailyPresent[day - 1]++;
                    totals.totalPresent++;
                } else if (status === 'ME') {
                    totals.dailyME[day - 1]++;
                    totals.totalME++;
                }
            }
        });

        return totals;
    };

    const handleRemarkChange = (employeeCode, value) => {
        setRemarks(prev => ({
            ...prev,
            [employeeCode]: value
        }));
    };

    const fetchHolidays = async (dateObject) => {
        try {
            const response = await axios.get('http://localhost:3003/api/common/getHolidays', {
                params: {
                    month: dateObject.getMonth() + 1,
                    year: dateObject.getFullYear()
                },
                headers: {
                    'token': localStorage.getItem('token')
                },
                signal: abortController.signal
            });

            if (response.data.success) {
                const holidayDays = response.data.holidays.map(holiday =>
                    new Date(holiday.date).getDate()
                );
                setHolidays(holidayDays);
            } else {
                message.error("Failed to fetch holidays");
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error("Error fetching holidays:", error);
                message.error("Failed to fetch holidays");
            }
        }
    };
    const fetchLocationName = async (locationid) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3003/api/common/getLocation`, {
                params: {
                    locationId: locationid,
                    locationType: 1  // Get Device Location TYPE-1
                },
                headers: {
                    'token': token
                }
            });

            if (response.data.success) {
                setLocationName(response.data.locationName);
            } else {
                message.error(response.data.message || "Failed to fetch location name");
            }
        } catch (error) {
            console.error("Error fetching location name:", error);
            message.error(error.response?.data?.message || "Failed to fetch location name");
        }
    };


    const fetchLogs = async (locationid, dateObject) => {
        setLoading(true);

        const month = dateObject.getMonth() + 1;
        const year = dateObject.getFullYear();
        const tableName = `DeviceLogs_${month}_${year}`;

        console.log("Fetching logs from table:", tableName);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3003/api/common/getDeviceLogs', {
                locationId: locationid,
                tableName: tableName,
                type: 3 // TYPE-3 Monthly report
            }, {
                headers: {
                    'token': token,
                    'Content-Type': 'application/json'
                },
                signal: abortController.signal
            });

            setLogs(response.data);
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("Request cancelled:", error.message);
            } else {
                message.error("Failed to fetch logs");
                console.error("Error fetching logs:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const getDayName = (year, month, day) => {
        const date = new Date(year, month, day);
        return date.toLocaleString('en-US', { weekday: 'short' });
    };

    const getDayNameLong = (year, month, day) => {
        const date = new Date(year, month, day);
        return date.toLocaleString('en-US', { weekday: 'long' });
    };


    const createCalendarData = () => {
        if (!duration) {
            return { calendar: [], columns: [] };
        }
    
        const calendar = [];
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        const isCurrentMonth = duration.getMonth() === new Date().getMonth() && duration.getFullYear() === new Date().getFullYear();
    
        const columns = [
            {
                title: 'Employee Code',
                dataIndex: 'EmployeeCode',
                key: 'EmployeeCode',
                width: 150,
                fixed: 'left',
                filteredValue: activeFilters.EmployeeCode || null,
                filters: [...new Set(logs.map(log => log.EmployeeCode))].map(code => ({
                    text: code,
                    value: code,
                })),
                onFilter: (value, record) => {
                    // Skip filtering for summary rows
                    if (record.isSummary || record.isTotal) return true;
                    return record.EmployeeCode === value;
                },
                render: (text, record) => {
                    if (record.isSummary) {
                        return {
                            children: text,
                            props: { colSpan: 1 }
                        };
                    }
                    return text;
                }
            },
            {
                title: 'Employee Name',
                dataIndex: 'EmployeeName',
                key: 'EmployeeName',
                width: 200,
                fixed: 'left',
                filteredValue: activeFilters.EmployeeName || null,
                filters: [...new Set(logs.map(log => log.EmployeeName))].map(name => ({
                    text: name,
                    value: name,
                })),
                onFilter: (value, record) => {
                    // Skip filtering for summary rows
                    if (record.isSummary || record.isTotal) return true;
                    return record.EmployeeName === value;
                },
                render: (text, record) => {
                    if (record.isSummary) {
                        return {
                            children: record.totalPresent,
                            props: { colSpan: columns.length - 1 }
                        };
                    }
                    return text;
                }
            },
            {
                title: 'Gender',
                dataIndex: 'Gender',
                key: 'Gender',
                width: 100,
                filteredValue: activeFilters.Gender || null,
                filters: [
                    { text: 'Male', value: 'Male' },
                    { text: 'Female', value: 'Female' },
                ],
                onFilter: (value, record) => {
                    // Skip filtering for summary rows
                    if (record.isSummary || record.isTotal) return true;
                    return record.Gender === value;
                },
                render: (text, record) => {
                    if (record.isSummary) {
                        return { props: { colSpan: 0 } };
                    }
                    return text;
                }
            },
            {
                title: 'Designation',
                dataIndex: 'Designation',
                key: 'Designation',
                fixed: 'left',
                width: 150,
                filteredValue: activeFilters.Designation || null,
                filters: [...new Set(logs.map(log => log.Designation))].map(designation => ({
                    text: designation,
                    value: designation,
                })),
                onFilter: (value, record) => {
                    // Skip filtering for summary rows
                    if (record.isSummary || record.isTotal) return true;
                    return record.Designation === value;
                },
                render: (text, record) => {
                    if (record.isSummary) {
                        return { props: { colSpan: 0 } };
                    }
                    return text;
                }
            }
        ];
    
        // Generate day columns
        for (let day = 1; day <= daysInMonth; day++) {
            const dayName = getDayName(duration.getFullYear(), duration.getMonth(), day);
            columns.push({
                title: (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>{dayName}</div>
                        <div>{day}</div>
                    </div>
                ),
                dataIndex: `day${day}`,
                key: `day${day}`,
                width: 60,
                filters: [
                    { text: 'Present', value: 'P' },
                    { text: 'Absent', value: 'A' },
                    { text: 'Weekly Off', value: 'WO' },
                    { text: 'Manual Entry', value: 'ME' },
                ],
                onFilter: (value, record) => {
                    // Skip filtering for summary rows
                    if (record.isSummary || record.isTotal) return true;
                    return record[`day${day}`] === value;
                },
                render: (status, record) => {
                    if (record.isSummary) {
                        return { props: { colSpan: 0 } };
                    }
                    return (
                        <span style={{
                            color: status === 'P' ? 'green'
                                : status === 'A' ? 'red'
                                : status === 'WO' ? 'blue'
                                : status === 'ME' ? 'orange'
                                : status === 'PH' ? 'purple'
                                : 'black',
                        }}>
                            {(!isCurrentMonth || day <= currentDay) ? status || '' : ''}
                        </span>
                    );
                }
            });
        }
    
        // Add extra columns
        columns.push(
            {
                title: 'Total Present',
                dataIndex: 'totalPresent',
                key: 'totalPresent',
                width: 100,
                fixed: 'right',
                render: (_, record) => {
                    if (record.isSummary) {
                        return { props: { colSpan: 0 } };
                    }
                    if (record.isTotal) {
                        // Calculate totals only for filtered/visible records
                        const visibleRecords = calendar.filter(r => {
                            if (r.isSummary || r.isTotal) return false;
                            return columns.every(col => {
                                if (!col.onFilter) return true;
                                if (!col.filteredValue || col.filteredValue.length === 0) return true;
                                return col.filteredValue.some(filterValue => 
                                    col.onFilter(filterValue, r)
                                );
                            });
                        });
                        const totals = calculateDailyTotals(visibleRecords);
                        console.log(totals,"zz");
                        
                        return `Total : ${totals.totalPresent + totals.totalME}`;
                    }
                    return calculateTotalPresent(record);
                }
            },
            {
                title: 'Remarks',
                dataIndex: 'remarks',
                key: 'remarks',
                width: 200,
                fixed: 'right',
                render: (_, record) => {
                    if (record.isSummary) {
                        return { props: { colSpan: 0 } };
                    }
                    return (
                        <Input
                            placeholder="Enter remarks"
                            value={remarks[record.EmployeeCode] || ''}
                            onChange={(e) => handleRemarkChange(record.EmployeeCode, e.target.value)}
                        />
                    );
                }
            }
        );
    
        // Group logs by EmployeeCode
        const groupedLogs = logs.reduce((acc, log) => {
            const { EmployeeCode, EmployeeName, Gender, Designation, LogDate, IsWeeklyOff1, IsWeeklyOff2, WeeklyOff1Day, WeeklyOff2Day, AttendanceMarkingType } = log;
    
            if (!acc[EmployeeCode]) {
                acc[EmployeeCode] = {
                    EmployeeCode,
                    EmployeeName,
                    Gender: Gender || '',
                    Designation: Designation || '',
                };
    
                // Mark all days as absent initially
                for (let day = 1; day <= daysInMonth; day++) {
                    acc[EmployeeCode][`day${day}`] = 'A';
                }
    
                // Mark holidays
                holidays.forEach(holidayDay => {
                    acc[EmployeeCode][`day${holidayDay}`] = 'PH';
                });
    
                // Mark weekly offs
                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDayName = getDayNameLong(duration.getFullYear(), duration.getMonth(), day);
                    if ((IsWeeklyOff1 && currentDayName === WeeklyOff1Day) ||
                        (IsWeeklyOff2 && currentDayName === WeeklyOff2Day)) {
                        if (acc[EmployeeCode][`day${day}`] !== 'PH') {
                            acc[EmployeeCode][`day${day}`] = 'WO';
                        }
                    }
                }
            }
    
            // Mark attendance
            if (LogDate) {
                const day = new Date(LogDate).getDate();
                const currentStatus = acc[EmployeeCode][`day${day}`];
                if (currentStatus !== 'PH' && currentStatus !== 'WO') {
                    acc[EmployeeCode][`day${day}`] = AttendanceMarkingType === 'ME' ? 'ME' : 'P';
                }
            }
    
            return acc;
        }, {});
    
        // Create calendar data
        for (const employee of Object.values(groupedLogs)) {
            calendar.push(employee);
        }
    
        // Function to get filtered records
        const getFilteredRecords = () => {
            return calendar.filter(record => {
                if (record.isSummary || record.isTotal) return false;
                return columns.every(col => {
                    if (!col.onFilter) return true;
                    if (!col.filteredValue || col.filteredValue.length === 0) return true;
                    return col.onFilter(col.filteredValue[0], record);
                });
            });
        };
    
        // Calculate totals for filtered data
        const filteredRecords = getFilteredRecords();
        const totals = calculateDailyTotals(filteredRecords);
    
        // Create summary rows
        const summaryRow = {
            EmployeeCode: 'TOTAL',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            key: 'summary-row',
            isTotal: true,
        };
    
        // Add daily totals to summary row
        for (let day = 1; day <= daysInMonth; day++) {
            summaryRow[`day${day}`] = `${totals.dailyPresent[day - 1]}`;
        }
    
        const requiredAttendanceRow = {
            EmployeeCode: 'Attendance Required as per Contract',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            totalPresent: totalCount,
            key: 'required-attendance',
            isSummary: true
        };
    
        const totalPresentRow = {
            EmployeeCode: 'Total Present',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            totalPresent: totals.totalPresent,
            key: 'total-present',
            isSummary: true
        };

        const Absenteeism = {
            EmployeeCode: 'Absenteeism',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            totalPresent: Math.max(0, totalCount - totals.totalPresent),
            key: 'Absenteeism',
            isSummary: true
        };
    
        const regularizedAttendanceRow = {
            EmployeeCode: 'Regularized Attendance',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            totalPresent: totals.totalME,
            key: 'regularized-attendance',
            isSummary: true
        };
    
        // Add summary rows to calendar
        calendar.push(
            summaryRow,
            requiredAttendanceRow,
            totalPresentRow,
            Absenteeism,
            regularizedAttendanceRow
        );
    
        return { calendar, columns, totals };
    };

    const renderSummary = (currentPageData) => {
        // Get the summary row (last row) from the current data
        const summaryRow = currentPageData.find(record => record.isTotal);
        if (!summaryRow) return null;

        // Calculate totals from the non-summary rows
        const dataWithoutSummary = currentPageData.filter(record => !record.isTotal);
        const totals = calculateDailyTotals(dataWithoutSummary);

        return (
            <div className="bg-gray-50 mt-4 text-left p-4">
                <Space size="large">
                    <Text className="font-bold">Summary:</Text>
                    <Text>Biometric Attendance (P): {totals.totalPresent}</Text>
                    <Text>Manual Entry (ME): {totals.totalME}</Text>
                    <Text className="font-bold">Total Present: {totals.totalPresent + totals.totalME}</Text>
                </Space>
            </div>
        );
    };

    const createSummaryRow = (data) => {
        const dataWithoutSummary = data.filter(record => !record.isTotal);
        const totals = calculateDailyTotals(dataWithoutSummary);
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();

        const summaryRow = {
            EmployeeCode: 'TOTAL',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            key: 'summary-row',
            isTotal: true
        };

        // Add daily totals
        for (let day = 1; day <= daysInMonth; day++) {
            const presentCount = totals.dailyPresent[day - 1];
            const meCount = totals.dailyME[day - 1];
            // Show both biometric and manual entries in the total
            summaryRow[`day${day}`] = `${presentCount + meCount}`;
        }

        return summaryRow;
    };

    const handleTableChange = (pagination, filters, sorter) => {
        const hasActiveFilters = Object.values(filters).some(filter => filter && filter.length > 0);
        setActiveFilters(filters);

        const { calendar } = createCalendarData();
        let dataWithoutSummary = calendar.filter(record => !record.isTotal);

        if (hasActiveFilters) {
            // Apply filters to the data
            let filteredDataRows = dataWithoutSummary.filter(record => {
                return Object.keys(filters).every(key => {
                    const selectedFilters = filters[key];
                    return !selectedFilters || selectedFilters.length === 0 || selectedFilters.includes(record[key]);
                });
            });

            // Create new summary row based on filtered data
            const summaryRow = createSummaryRow(filteredDataRows);

            // Combine filtered data with new summary row
            const finalData = [...filteredDataRows, summaryRow];
            setFilteredData(finalData);
        } else {
            setFilteredData([]);
        }
    };


    const getCurrentData = () => {
        const { calendar } = createCalendarData();
        return filteredData.length > 0 ? filteredData : calendar;
    };



    const getMonthYearString = () => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[duration.getMonth()]} ${duration.getFullYear()}`;
    };

    const exportToPdf = async () => {

        let storedName = localStorage.getItem('reportSubmissionName');
    
    // Show modal with name input
    const showNameModal = () => {
        return new Promise((resolve) => {
            Modal.confirm({
                title: 'Enter School Representative Name',
                width: 400,
                icon: null,
                content: (
                    <Input 
                        placeholder="Enter name" 
                        defaultValue={storedName || ''}
                        onChange={(e) => {
                            localStorage.setItem('reportSubmissionName', e.target.value);
                        }}
                    />
                ),
                onOk() {
                    const name = localStorage.getItem('reportSubmissionName');
                    resolve({ name, cancelled: false });
                },
                onCancel() {
                    localStorage.setItem('reportSubmissionName'," ");
                    storedName='';
                    resolve({ cancelled: true });
                },
            });
        });
    };

        try {
            setExportLoading(true);

            // Show modal and get user input
    const modalResult = await showNameModal();
        
    // Proceed with export even if modal was cancelled
    const schoolRepName = modalResult.cancelled ? (storedName || '') : modalResult.name;
    
            // Use filtered data if available
            const dataToExport = getCurrentData();
    
            if (!dataToExport || dataToExport.length === 0) {
                message.warning("No attendance data available to export.");
                return;
            }
    
            // Calculate totals based on the filtered data
            const calculateFilteredTotals = (filteredData) => {
                const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
                const dailyPresent = Array(daysInMonth).fill(0);
                const dailyME = Array(daysInMonth).fill(0);
                let totalPresent = 0;
                let totalME = 0;
    
                // Calculate daily totals from filtered data
                filteredData.forEach(employee => {
                    if (!employee.isTotal && !employee.isSummary) {
                        for (let day = 1; day <= daysInMonth; day++) {
                            const status = employee[`day${day}`];
                            if (status === 'P') {
                                dailyPresent[day - 1]++;
                                totalPresent++;
                            } else if (status === 'ME') {
                                dailyME[day - 1]++;
                                totalME++;
                            }
                        }
                    }
                });
    
                return {
                    dailyPresent,
                    dailyME,
                    totalPresent,
                    totalME
                };
            };
    
            const filteredTotals = calculateFilteredTotals(dataToExport);
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
    
            // Initialize PDF in landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
    
            // Define page dimensions and margins
            const pageWidth = pdf.internal.pageSize.width;
            const pageHeight = pdf.internal.pageSize.height;
            const margins = {
                left: 3,
                right: 3,
                top: 25,
                bottom: 15
            };

            // Logo dimensions and positions
        const logoWidth = 15; // Width in mm
        const logoHeight = 10; // Height in mm
        
        // Left logo position
        const leftLogoX = margins.left;
        const leftLogoY = 5;

        // Right logo position
        const rightLogoX = pageWidth - margins.right - logoWidth;
        const rightLogoY = 5;

        // Add logos - Replace 'leftLogoUrl' and 'rightLogoUrl' with your actual logo URLs or base64 strings
        pdf.addImage(logo1, leftLogoX, leftLogoY, logoWidth, logoHeight);
        pdf.addImage(logo2, rightLogoX, rightLogoY, logoWidth, logoHeight);
    
            // Calculate available width for content
            const availableWidth = pageWidth - margins.left - margins.right;
    
            // Define fixed column widths (in mm)
            const columnWidths = {
                employeeCode: Math.floor(availableWidth * 0.05),
                name: Math.floor(availableWidth * 0.10),
                gender: Math.floor(availableWidth * 0.04),
                designation: Math.floor(availableWidth * 0.05),
                totalPresent: Math.floor(availableWidth * 0.04),
                remarks: Math.floor(availableWidth * 0.07)
            };
    
            // Calculate width for date columns
            const fixedColumnsWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
            const remainingWidth = availableWidth - fixedColumnsWidth;
            const dateColumnWidth = Math.min(7, Math.floor(remainingWidth / daysInMonth)) + 0.2;
    
            // Add title
            pdf.setFontSize(11);
            const title = `${locationName}`;
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(title, (pageWidth - titleWidth) / 2, 15);
    
            // Second title
            const title2 = `Attendance Report - ${getMonthYearString()}`;
            const title2Width = pdf.getStringUnitWidth(title2) * pdf.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(title2, (pageWidth - title2Width) / 2, 22);
    
            // Prepare headers
            const headers = [
                [
                    'Emp Code',
                    'Name',
                    'Gender',
                    'Designation',
                    ...Array.from({ length: daysInMonth }, (_, i) =>
                        getDayName(duration.getFullYear(), duration.getMonth(), i + 1)
                    ),
                    'Total Present',
                    'Remarks'
                ],
                [
                    '',
                    '',
                    '',
                    '',
                    ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
                    '',
                    ''
                ]
            ];
    
            // Prepare table data (excluding total row and summary rows)
            const employeeData = dataToExport
                .filter(row => !row.isTotal && !row.isSummary)
                .map(employee => [
                    employee.EmployeeCode || '',
                    employee.EmployeeName || '',
                    employee.Gender || '',
                    employee.Designation || '',
                    ...Array.from({ length: daysInMonth }, (_, i) => employee[`day${i + 1}`] || ''),
                    calculateTotalPresent(employee),
                    remarks[employee.EmployeeCode] || ''
                ]);
    
            // Create total row
            const totalRow = [
                'TOTAL',
                '',
                '',
                '',
                ...Array.from({ length: daysInMonth }, (_, i) => `${filteredTotals.dailyPresent[i]}`),
                `Total : ${filteredTotals.totalPresent + filteredTotals.totalME}`,
                ''
            ];
    
            // Create summary rows with proper formatting
            const summaryRows = [
                // [
                //     'Attendance Required as per Contract',
                //     totalCount.toString(),
                //     '',
                //     '',
                //     ...Array(daysInMonth).fill(''),
                //     '',
                //     ''
                // ],
                // [
                //     'Attendance as per the current month',
                //     filteredTotals.totalPresent.toString(),
                //     '',
                //     '',
                //     ...Array(daysInMonth).fill(''),
                //     '',
                //     ''
                // ],
                //  [
                //     'Absenteeism',
                //     Math.max(0, totalCount - filteredTotals.totalPresent).toString(),,
                //     '',
                //     '',
                //     ...Array(daysInMonth).fill(''),
                //     '',
                //     ''
                // ],
                [
                    'Regularized Attendance',
                    filteredTotals.totalME.toString(),
                    '',
                    '',
                    ...Array(daysInMonth).fill(''),
                    '',
                    ''
                ]
            ];
    
            // Combine all rows in the desired order
            const tableData = [...employeeData, totalRow, ...summaryRows];
    
            // Create column styles object
            const columnStyles = {
                0: { cellWidth: columnWidths.employeeCode },
                1: { cellWidth: columnWidths.name },
                2: { cellWidth: columnWidths.gender },
                3: { cellWidth: columnWidths.designation }
            };
    
            // Add date column styles
            for (let i = 4; i < 4 + daysInMonth; i++) {
                columnStyles[i] = { cellWidth: dateColumnWidth };
            }
    
            // Add total present and remarks column styles
            columnStyles[4 + daysInMonth] = { cellWidth: columnWidths.totalPresent };
            columnStyles[5 + daysInMonth] = { cellWidth: columnWidths.remarks };
    
            // Add the table to the PDF
            pdf.autoTable({
                head: headers,
                body: tableData,
                startY: 25,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 1,
                    overflow: 'linebreak',
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 8,
                },
                columnStyles: columnStyles,
                headStyles: {
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 6,
                },
                didParseCell: function (data) {
                    // Style attendance status cells
                    if (data.section === 'body' && data.column.index >= 4 &&
                        data.column.index < 4 + daysInMonth) {
                        const value = data.cell.raw;
                        switch (value) {
                            case 'P':
                                data.cell.styles.fillColor = [200, 255, 200];
                                data.cell.styles.textColor = [0, 100, 0];
                                break;
                            case 'A':
                                data.cell.styles.fillColor = [255, 200, 200];
                                data.cell.styles.textColor = [150, 0, 0];
                                break;
                            case 'ME':
                                data.cell.styles.fillColor = [255, 229, 204];
                                data.cell.styles.textColor = [204, 102, 0];
                                break;
                            case 'WO': // Weekly Off case
                                data.cell.styles.fillColor = [192, 192, 192]; // Grey background
                                data.cell.styles.textColor = [255, 255, 255]; // White text
                                break;
                            case 'PH':
                                    data.cell.styles.fillColor = [173, 216, 230]; // Light blue for leave color
                                    data.cell.styles.textColor = [0, 0, 139]; // Dark blue text
                                    break;
                        }
                    }
                    
                    // Style total row and summary rows
                    if (data.section === 'body') {
                        if (data.row.index === employeeData.length) {
                            // Total row
                            data.cell.styles.fontStyle = 'bold';
                        } else if (data.row.index > employeeData.length) {
                            // Summary rows
                            data.cell.styles.fontStyle = 'bold';
                            if (data.column.index <= 1) {
                                data.cell.styles.halign = 'left';
                            }
                        }
                    }
                },
                didDrawPage: function (data) {
                    // Add footer
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
    
                    // Add page number
                    pdf.text(
                        `Page ${data.pageNumber} of ${pdf.internal.getNumberOfPages()}`,
                        margins.left,
                        pageHeight - 5
                    );
    
                    // Add generation date
                    pdf.text(
                        `Generated: ${new Date().toLocaleDateString()}`,
                        pageWidth - 60,
                        pageHeight - 5
                    );
                },
                margin: margins,
            });
    
            // Add total employees on the last page
            const lastPage = pdf.internal.getNumberOfPages();
            pdf.setPage(lastPage);
            pdf.setFontSize(8);
            pdf.setTextColor(0);
    
            const totalEmployees = dataToExport.filter(row => !row.isTotal && !row.isSummary).length;
            // const summary = `Total Employees: ${totalEmployees}`;
            // pdf.text(summary, margins.left, pageHeight - 20);

            ///Signature

             // Add signature tables
        const signatureTablesY = pageHeight - 60; // Position for signature tables
        const tableWidth = 85; // Width of each signature table
        const tableHeight = 40; // Height of each signature table
        const spacing = 8; // Spacing between tables

        // Calculate x positions for three tables
        const table1X = margins.left;
        const table2X = (pageWidth - tableWidth) / 2;
        const table3X = pageWidth - margins.right - tableWidth;

        // Function to draw a single signature table
        // const drawSignatureTable = (startX, startY, title, data) => {
        //     // Draw outer border
        //     pdf.rect(startX, startY, tableWidth, tableHeight);
            
        //     // Draw title row
        //     pdf.setFillColor(240, 240, 240);
        //     pdf.rect(startX, startY, tableWidth, 8, 'F');
        //     pdf.setFontSize(8);
        //     pdf.text(title, startX + tableWidth/2, startY + 5, { align: 'center' });

        //     // Draw rows
        //     const rowHeight = 8;
        //     let currentY = startY + 8;

        //     // Helper function to draw a row
        //     const drawRow = (label, value) => {
        //         pdf.setFontSize(7);
        //         pdf.line(startX, currentY, startX + tableWidth, currentY);
        //         pdf.line(startX + 25, currentY, startX + 25, currentY + rowHeight);
        //         pdf.text(label, startX + 2, currentY + 5);
        //         if (value) {
        //             pdf.text(value, startX + 27, currentY + 5);
        //         }
        //         currentY += rowHeight;
        //     };

        //     // Draw each row with data
        //     Object.entries(data).forEach(([label, value]) => {
        //         drawRow(label, value);
        //     });
        // };

        // const drawSignatureTable = (startX, startY, title, data) => {
        //     // Draw outer border
        //     pdf.rect(startX, startY, tableWidth, tableHeight);
            
        //     // Draw title row with border
        //     pdf.rect(startX, startY, tableWidth, 8); // Header border
        //     pdf.setFillColor(255, 255, 255);
        //     pdf.rect(startX, startY, tableWidth, 8, 'F');
        //     pdf.setFontSize(8);
        //     pdf.text(title, startX + tableWidth/2, startY + 5, { align: 'center' });
            
        //     // Draw border around title
        //     pdf.line(startX, startY, startX + tableWidth, startY); // Top line
        //     pdf.line(startX, startY + 8, startX + tableWidth, startY + 8); // Bottom line
        //     pdf.line(startX, startY, startX, startY + 8); // Left line
        //     pdf.line(startX + tableWidth, startY, startX + tableWidth, startY + 8); // Right line
            
        //     // Draw rows
        //     const rowHeight = 8;
        //     let currentY = startY + 8;
        
        //     // Helper function to draw a row
        //     const drawRow = (label, value) => {
        //         pdf.setFontSize(7);
                
        //         // Draw horizontal line for current row
        //         pdf.line(startX, currentY, startX + tableWidth, currentY);
                
        //         // Draw vertical line separating label and value
        //         pdf.line(startX + 25, currentY, startX + 25, currentY + rowHeight);
                
        //         // Add text
        //         pdf.text(label, startX + 2, currentY + 5);
        //         if (value) {
        //             if (title === 'Attendance Summary') {
        //                 // Right align numbers for attendance summary
        //                 const valueWidth = pdf.getStringUnitWidth(value) * 7 / pdf.internal.scaleFactor;
        //                 pdf.text(value, startX + tableWidth - 2 - valueWidth, currentY + 5);
        //             } else {
        //                 // Left align text for other tables
        //                 pdf.text(value, startX + 27, currentY + 5);
        //             }
        //         }
                
        //         // Draw vertical borders
        //         pdf.line(startX, currentY, startX, currentY + rowHeight); // Left border
        //         pdf.line(startX + tableWidth, currentY, startX + tableWidth, currentY + rowHeight); // Right border
                
        //         currentY += rowHeight;
        //     };
        
        //     // Draw each row with data
        //     Object.entries(data).forEach(([label, value], index, array) => {
        //         drawRow(label, value);
                
        //         // Draw bottom border for last row
        //         if (index === array.length - 1) {
        //             pdf.line(startX, currentY, startX + tableWidth, currentY);
        //         }
        //     });
        // };

        const drawSignatureTable = (startX, startY, title, data) => {
            // Draw outer border
            pdf.rect(startX, startY, tableWidth, tableHeight);
            
            // Draw title row with border
            pdf.rect(startX, startY, tableWidth, 8); // Header border
            pdf.setFillColor(255, 255, 255);
            pdf.rect(startX, startY, tableWidth, 8, 'F');
            pdf.setFontSize(8);
            pdf.text(title, startX + tableWidth/2, startY + 5, { align: 'center' });
            
            // Draw border around title
            pdf.line(startX, startY, startX + tableWidth, startY); // Top line
            pdf.line(startX, startY + 8, startX + tableWidth, startY + 8); // Bottom line
            pdf.line(startX, startY, startX, startY + 8); // Left line
            pdf.line(startX + tableWidth, startY, startX + tableWidth, startY + 8); // Right line
            
            // Draw rows
            const rowHeight = 8;
            let currentY = startY + 8;
        
            // Helper function to draw a row with text wrapping
            const drawRow = (label, value) => {
                pdf.setFontSize(7);
                
                // Draw horizontal line for current row
                pdf.line(startX, currentY, startX + tableWidth, currentY);
                
                // Calculate available widths for label and value
                const labelWidth = 50; // Increased width for label
                const valueWidth = tableWidth - labelWidth - 4; // Remaining width for value
                
                // Draw vertical line separating label and value
                pdf.line(startX + labelWidth, currentY, startX + labelWidth, currentY + rowHeight);
                
                // Add text with wrapping if needed
                
                    // Split label text if it's too long
                    const labelText = label;
                    const words = labelText.split(' ');
                    let line = '';
                    let yOffset = 3;
                    
                    words.forEach((word, index) => {
                        const testLine = line + word + ' ';
                        const testWidth = pdf.getStringUnitWidth(testLine) * 7 / pdf.internal.scaleFactor;
                        
                        if (testWidth > labelWidth - 4) {
                            // Draw current line
                            pdf.text(line.trim(), startX + 2, currentY + yOffset);
                            line = word + ' ';
                            yOffset += 3;
                        } else {
                            line = testLine;
                        }
                        
                        // Draw last line or single line
                        if (index === words.length - 1) {
                            pdf.text(line.trim(), startX + 2, currentY + yOffset);
                        }
                    });
        
                    // Right align the value
                    const valueMetrics = pdf.getStringUnitWidth(value) * 7 / pdf.internal.scaleFactor;
                    pdf.text(value, startX + tableWidth - 2 - valueMetrics, currentY + 5);
               
                
                // Draw vertical borders
                pdf.line(startX, currentY, startX, currentY + rowHeight); // Left border
                pdf.line(startX + tableWidth, currentY, startX + tableWidth, currentY + rowHeight); // Right border
                
                currentY += rowHeight;
            };
        
            // Draw each row with data
            Object.entries(data).forEach(([label, value], index, array) => {
                drawRow(label, value);
                
                // Draw bottom border for last row
                if (index === array.length - 1) {
                    pdf.line(startX, currentY, startX + tableWidth, currentY);
                }
            });
        };

        
        // Draw Company Representative table
        drawSignatureTable(table1X, signatureTablesY, 'Company Representative', {
            'Name': `${firstName.toUpperCase()+ ' '+ lastName.toUpperCase()}`,
            'Designation': `${designation}`,
            'Signature': '',
            'Date': `${new Date().toLocaleDateString('en-GB')}`
        });


        // Draw Attendance Summary table
        drawSignatureTable(table2X, signatureTablesY, 'Attendance Summary', {
            'Attendance required as per the contract.': totalCount.toString(),
            'Attendance as per the current month': (filteredTotals.totalPresent+filteredTotals.totalME).toString(),
            'This month\'s shortfall': Math.max(0, totalCount - filteredTotals.totalPresent).toString(),
            'Consequent Absence': '0'
        });

        // Draw School Representative table
        drawSignatureTable(table3X, signatureTablesY, 'School Representative', {
            'Name': `${schoolRepName}`,
            'Designation': 'PRINCIPAL',
            'Signature': '',
            'Date': `${new Date().toLocaleDateString('en-GB')}`
        });

            ///end
    
            // Save the PDF
            const fileName = `${locationName}_Attendance_${duration.getFullYear()}_${(duration.getMonth() + 1).toString().padStart(2, '0')}.pdf`;
            pdf.save(fileName);
            message.success('PDF exported successfully');
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            message.error("Failed to export PDF file");
        } finally {
            setExportLoading(false);
        }
    };



const exportToExcel = async () => {


    let storedName = localStorage.getItem('reportSubmissionName');
    
    // Show modal with name input
    const showNameModal = () => {
        return new Promise((resolve) => {
            Modal.confirm({
                title: 'Enter School Representative Name',
                width: 400,
                icon: null,
                content: (
                    <Input 
                        placeholder="Enter name" 
                        defaultValue={storedName || ''}
                        onChange={(e) => {
                            localStorage.setItem('reportSubmissionName', e.target.value);
                        }}
                    />
                ),
                onOk() {
                    const name = localStorage.getItem('reportSubmissionName');
                    resolve({ name, cancelled: false });
                },
                onCancel() {
                    localStorage.setItem('reportSubmissionName'," ");
                    storedName='';
                    resolve({ cancelled: true });
                },
            });
        });
    };


    
    try {
        setExportLoading(true);

        // Show modal and get user input
        const modalResult = await showNameModal();
        
        // Proceed with export even if modal was cancelled
        const schoolRepName = modalResult.cancelled ? (storedName || '') : modalResult.name;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Logs');

        
        // Helper function to convert URL to base64
        const urlToBase64 = async (url) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error("Error converting URL to base64:", error);
                throw error;
            }
        };

        // Helper function to handle different types of image inputs
        const imageToBase64 = async (image) => {
            if (!image) return null;

            try {
                // If image is already a base64 string
                if (typeof image === 'string') {
                    // Check if it's a URL
                    if (image.startsWith('http') || image.startsWith('data:image')) {
                        if (image.startsWith('data:image')) {
                            // Already a base64 string, extract the actual base64 part
                            return image.split(',')[1];
                        } else {
                            // It's a URL, convert to base64
                            return await urlToBase64(image);
                        }
                    }
                    // If it's already a raw base64 string
                    return image;
                }
                // If image is a File or Blob
                else if (image instanceof Blob || image instanceof File) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(image);
                    });
                }
                throw new Error('Unsupported image format');
            } catch (error) {
                console.error("Error processing image:", error);
                return null;
            }
        };


        // Get base64 for both logos
        const [logo1Base64, logo2Base64] = await Promise.all([
            imageToBase64(logo1str),
            imageToBase64(logo2str)
        ]);

        // Calculate dimensions once
        const daysInMonth1 = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        const totalColumns = 4 + daysInMonth1 + 2; // Basic columns + days + total present + remarks

        // Add logos if they were successfully converted
        if (logo1Base64) {
            const leftLogoId = workbook.addImage({
                base64: logo1Base64,
                extension: 'png',
            });

            worksheet.addImage(leftLogoId, {
                tl: { col: 0, row: 0 },
                ext: { width: 100, height: 50 },
                editAs: 'oneCell'
            });
        }

        if (logo2Base64) {
            const rightLogoId = workbook.addImage({
                base64: logo2Base64,
                extension: 'png',
            });

            worksheet.addImage(rightLogoId, {
                tl: { col: totalColumns - 3, row: 0 },
                ext: { width: 100, height: 50 },
                editAs: 'oneCell'
            });
        }

        // Add row height for logo
        worksheet.getRow(1).height = 50;

        const dataToExport = getCurrentData();

        // Calculate totals based on the filtered data
        const calculateFilteredTotals = (filteredData) => {
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
            const dailyPresent = Array(daysInMonth).fill(0);
            const dailyME = Array(daysInMonth).fill(0);
            let totalPresent = 0;
            let totalME = 0;

            // Calculate daily totals from filtered data
            filteredData.forEach(employee => {
                if (!employee.isTotal && !employee.isSummary) {
                    for (let day = 1; day <= daysInMonth; day++) {
                        const status = employee[`day${day}`];
                        if (status === 'P') {
                            dailyPresent[day - 1]++;
                            totalPresent++;
                        } else if (status === 'ME') {
                            dailyME[day - 1]++;
                            totalME++;
                        }
                    }
                }
            });

            return {
                dailyPresent,
                dailyME,
                totalPresent,
                totalME
            };
        };

        if (dataToExport.length === 0) {
            message.warning("No attendance data available to export.");
            return;
        }

        // Calculate new totals based on filtered data
        const filteredTotals = calculateFilteredTotals(dataToExport);

        // const workbook = new ExcelJS.Workbook();
        // const worksheet = workbook.addWorksheet('Attendance Logs');
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();

        // Define columns first
        const columns = [
            { header: 'Emp Code', key: 'EmployeeCode', width: 12 },
            { header: 'Name', key: 'EmployeeName', width: 20 },
            { header: 'Gender', key: 'Gender', width: 8 },
            { header: 'Designation', key: 'Designation', width: 15 }
        ];

        // Add day columns
        for (let day = 1; day <= daysInMonth; day++) {
            const dayName = getDayName(duration.getFullYear(), duration.getMonth(), day);
            columns.push({
                header: dayName,
                key: `day${day}`,
                width: 7
            });
        }

        columns.push(
            { header: 'Total Present', key: 'totalPresent', width: 12 },
            { header: 'Remarks', key: 'remarks', width: 15 }
        );

        // Set the columns
        worksheet.columns = columns;

        // Insert two rows at the beginning for titles
        worksheet.spliceRows(1, 0, [], []); // Insert two empty rows at the top

        // Add title headers in the correct position
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = locationName;
        titleCell.alignment = { horizontal: 'center' };
        titleCell.font = { bold: true, size: 12 };

        worksheet.mergeCells('A2:G2');
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = `Attendance Report - ${getMonthYearString()}`;
        subtitleCell.alignment = { horizontal: 'center' };
        subtitleCell.font = { bold: true, size: 11 };

        // Add the day numbers as a second header row (now in row 4)
        const dayNumberRow = worksheet.getRow(4);
        dayNumberRow.getCell(1).value = '';
        dayNumberRow.getCell(2).value = '';
        dayNumberRow.getCell(3).value = '';
        dayNumberRow.getCell(4).value = '';
        for (let day = 1; day <= daysInMonth; day++) {
            dayNumberRow.getCell(day + 4).value = day.toString();
        }
        dayNumberRow.getCell(daysInMonth + 5).value = '';
        dayNumberRow.getCell(daysInMonth + 6).value = '';
        dayNumberRow.font = { bold: true };

        // Style both header rows (now rows 3 and 4)
        [3, 4].forEach(rowIndex => {
            const headerRow = worksheet.getRow(rowIndex);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Add data rows (excluding the total and summary rows)
        let currentRow = 5;
        dataToExport
            .filter(row => !row.isTotal && !row.isSummary)
            .forEach(employee => {
                const rowData = {
                    EmployeeCode: employee.EmployeeCode || '',
                    EmployeeName: employee.EmployeeName || '',
                    Gender: employee.Gender || '',
                    Designation: employee.Designation || '',
                    ...Array.from({ length: daysInMonth }, (_, i) => ({
                        [`day${i + 1}`]: employee[`day${i + 1}`] || ''
                    })).reduce((a, b) => Object.assign(a, b), {}),
                    totalPresent: calculateTotalPresent(employee),
                    remarks: remarks[employee.EmployeeCode] || ''
                };

                const row = worksheet.addRow(rowData);

                // Style attendance cells
                for (let day = 1; day <= daysInMonth; day++) {
                    const cell = row.getCell(`day${day}`);
                    if (cell.value === 'P') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC8FFD0' }
                        };
                    } else if (cell.value === 'A') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFC8C8' }
                        };
                    } else if (cell.value === 'ME') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFE5CC' }
                        };
                    }
                    else if (cell.value === 'WO') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD3D3D3' } 

                        };
                    }
                }
                currentRow++;
            });

        // Add the total row
        const totalRow = worksheet.addRow({
            EmployeeCode: 'TOTAL',
            EmployeeName: '',
            Gender: '',
            Designation: '',
            ...Array.from({ length: daysInMonth }, (_, i) => ({
                [`day${i + 1}`]: `${filteredTotals.dailyPresent[i]}`
            })).reduce((a, b) => Object.assign(a, b), {}),
            totalPresent: `Total : ${filteredTotals.totalPresent + filteredTotals.totalME}`,
            remarks: ''
        });
        totalRow.font = { bold: true };

        // Add empty row for spacing
        worksheet.addRow([]);

       
     
        const createSignatureTable = (startRow, startCol, title, data) => {
            // Add title
            const titleRow = worksheet.getRow(startRow);
            const titleCell = titleRow.getCell(startCol);
            titleCell.value = title;
            titleCell.font = { bold: true };
            titleCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF' }
            };
            titleCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thin' }
            };
            worksheet.mergeCells(startRow, startCol, startRow, startCol + 1);

            // Add data rows
            let currentRow = startRow + 1;
            Object.entries(data).forEach(([label, value]) => {
                const row = worksheet.getRow(currentRow);
                const labelCell = row.getCell(startCol);
                const valueCell = row.getCell(startCol + 1);

                labelCell.value = label;
                valueCell.value = value;

                // Style cells
                [labelCell, valueCell].forEach(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                        bottom: { style: 'thin' }
                    };
                });

                if (title === 'Attendance Summary') {
                    valueCell.alignment = { horizontal: 'right' };
                }

                currentRow++;
            });

            // Return the height of the table (title + data rows)
            return Object.keys(data).length + 1;
        };

        // Calculate the starting row for signature tables
        const lastDataRow = worksheet.lastRow.number;
        const signatureTableStartRow = lastDataRow + 3;

        // Create Company Representative table
        createSignatureTable(
            signatureTableStartRow,
            1, // Column A
            'Company Representative',
            {
                'Name': `${firstName.toUpperCase()+ ''+lastName.toUpperCase()}`,
                'Designation': `${designation}`,
                'Signature': '',
                'Date': `${new Date().toLocaleDateString('en-GB')}`
            }
        );

        // Create Attendance Summary table
        createSignatureTable(
            signatureTableStartRow,
            4, // Column D
            'Attendance Summary',
            {
                'Attendance required as per the contract.': totalCount.toString(),
                'Attendance as per the current month': (filteredTotals.totalPresent + filteredTotals.totalME).toString(),
                "This month's shortfall": Math.max(0, totalCount - filteredTotals.totalPresent).toString(),
                'Consequent Absence': '0'
            }
        );

        // Create School Representative table
        createSignatureTable(
            signatureTableStartRow,
            7, // Column G
            'School Representative',
            {
                'Name': `${schoolRepName}`,
                'Designation': 'PRINCIPAL',
                'Signature': '',
                'Date': `${new Date().toLocaleDateString('en-GB')}`
            }
        );

        // Set column widths for signature tables
        [1, 2, 4, 5, 7, 8].forEach(col => {
            worksheet.getColumn(col).width = 15;
        });


        // Generate buffer and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${locationName}_Attendance_${duration.getFullYear()}_${(duration.getMonth() + 1).toString().padStart(2, '0')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        message.success('Excel exported successfully');
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        message.error("Failed to export Excel file");
    } finally {
        setExportLoading(false);
    }
};


    const { calendar, columns } = createCalendarData();

    const actions = [
        <EditOutlined key="edit" />,
        <SettingOutlined key="setting" />,
        <EllipsisOutlined key="ellipsis" />,
    ];

    return (
        <Row style={{ width: '100%' }}>
            <Col span={24}>
                {loading ? (
                    <Card loading={loading} style={{ width: '100%' }} />
                ) : calendar.length > 0 ? (
                    <Card style={{ width: '100%', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <Title level={5} style={{ margin: 0 }}>{locationName}</Title>
                            <Title level={5} style={{ margin: '2px 0' }}>Attendance Report - {getMonthYearString()}</Title>
                        </div>
                       
                        {renderContractSummary()}
                        {renderControls()}
                        <Table
                            dataSource={getCurrentData()}
                            columns={columns}
                            pagination={false}
                            rowKey="EmployeeCode"
                            bordered
                            scroll={{ x: 'max-content' }}
                            onChange={handleTableChange}
                            footer={() => renderSummary(getCurrentData())}
                        />
                        {/* <div>{actions}</div> */}
                    </Card>
                ) : (
                    <Empty />
                )}
            </Col>
        </Row>
    );
}
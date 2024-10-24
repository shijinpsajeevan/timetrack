import React, { useState, useEffect } from 'react';
import { Col, Card, Row, Empty, message, Button, Table, Space } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AttMonthly({ locationid, duration }) {
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const abortController = new AbortController();

    useEffect(() => {
        if (locationid && duration) {
            console.log("Data found", locationid, duration);
            fetchLogs(locationid, duration);
        } else {
            console.log("Props not passed down to AttMonthly due to null value or incorrect selection");
            setLoading(false);
        }

        return () => {
            abortController.abort();
        };
    }, [locationid, duration]);

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
        const columns = [
            { title: 'Employee Code', dataIndex: 'EmployeeCode', key: 'EmployeeCode', width: 150 },
            { title: 'Employee Name', dataIndex: 'EmployeeName', key: 'EmployeeName', width: 200 },
            { title: 'Gender', dataIndex: 'Gender', key: 'Gender', width: 100 },
            { title: 'Designation', dataIndex: 'Designation', key: 'Designation', width: 150 },
        ];
    
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
                render: (status) => (
                    <span style={{ color: status === 'P' ? 'green' : status === 'A' ? 'red' : status === 'WO' ? 'blue' : 'black' }}>
                        {status}
                    </span>
                ),
            });
        }
    
        const groupedLogs = logs.reduce((acc, log) => {
            const { EmployeeCode, EmployeeName, Gender, Designation, LogDate, IsWeeklyOff1, IsWeeklyOff2, WeeklyOff1Day, WeeklyOff2Day } = log;
            const day = new Date(LogDate).getDate();
    
            if (!acc[EmployeeCode]) {
                acc[EmployeeCode] = {
                    EmployeeCode,
                    EmployeeName,
                    Gender: Gender || '',
                    Designation: Designation || '',
                    ...Array.from({ length: daysInMonth }, (_, index) => ({
                        [`day${index + 1}`]: 'A', // Default to 'Absent'
                    })).reduce((a, b) => Object.assign(a, b), {}),
                };
            }
    
            // Mark as Present if log exists
            acc[EmployeeCode][`day${day}`] = 'P'; 
    
            // Add Weekly Off logic
            for (let d = 1; d <= daysInMonth; d++) {
                const currentDayName = getDayNameLong(duration.getFullYear(), duration.getMonth(), d); // Get the weekday name
                console.log(currentDayName,"currday");
                
                if (IsWeeklyOff1 && currentDayName === WeeklyOff1Day) {
                    acc[EmployeeCode][`day${d}`] = 'WO'; // Mark Weekly Off 1
                }
                if (IsWeeklyOff2 && currentDayName === WeeklyOff2Day) {
                    acc[EmployeeCode][`day${d}`] = 'WO'; // Mark Weekly Off 2
                }
            }
    
            return acc;
        }, {});
    
        for (const employee of Object.values(groupedLogs)) {
            calendar.push(employee);
        }
    
        return { calendar, columns };
    };
    
    

    const getMonthYearString = () => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[duration.getMonth()]} ${duration.getFullYear()}`;
    };

    const exportToPdf = async () => {
        try {
            setExportLoading(true);
            const { calendar } = createCalendarData();
            if (calendar.length === 0) {
                message.warning("No attendance data available to export.");
                return;
            }
    
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
    
            // Initialize PDF in landscape
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
    
            // Get page dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
    
            // Add title
            pdf.setFontSize(14);
            const title = `Attendance Report - ${getMonthYearString()}`;
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(title, (pageWidth - titleWidth) / 2, 15); // Center the title
    
            // Prepare headers with day names and day numbers
            const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dayName = getDayName(duration.getFullYear(), duration.getMonth(), dayNum);
                return { content: dayName, rowSpan: 2 }; // Day names row
            });
    
            const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()); // Day numbers row
    
            // Prepare table headers
            const headers = [
                ['Emp Code', 'Name', 'Gender', 'Designation', ...dayHeaders.map(header => header.content)],
                [' ', ' ', ' ', ' ', ...dayNumbers] // Empty strings for alignment
            ];
    
            // Prepare table data
            const tableData = calendar.map(employee => [
                employee.EmployeeCode || '',
                employee.EmployeeName || '',
                employee.Gender || '',
                employee.Designation || '',
                ...Array.from({ length: daysInMonth }, (_, i) => employee[`day${i + 1}`] || 'N/A')
            ]);
    
            // Calculate column widths based on page size
            const fixedColWidths = {
                0: 20, // Emp Code
                1: 35, // Name
                2: 10, // Gender
                3: 25, // Designation
            };
    
            // Calculate remaining width for date columns
            const usedWidth = Object.values(fixedColWidths).reduce((a, b) => a + b, 0);
            const remainingWidth = pageWidth - 20; // 20mm total margin
            const dateColumnWidth = (remainingWidth - usedWidth) / daysInMonth;
    
            // Create column styles
            const columnStyles = {
                0: { cellWidth: fixedColWidths[0] },
                1: { cellWidth: fixedColWidths[1] },
                2: { cellWidth: fixedColWidths[2] },
                3: { cellWidth: fixedColWidths[3] },
            };
    
            // Add date column styles
            for (let i = 4; i < 4 + daysInMonth; i++) {
                columnStyles[i] = { cellWidth: dateColumnWidth };
            }
    
            // Add the table to the PDF with proper styling
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
                    fontSize: 7,
                },
                didParseCell: function(data) {
                    // Set background color for status cells
                    if (data.section === 'body' && data.column.index >= 4) {
                        const value = data.cell.raw;
                        if (value === 'P') {
                            data.cell.styles.fillColor = [200, 255, 200];
                            data.cell.styles.textColor = [0, 100, 0];
                        } else if (value === 'A') {
                            data.cell.styles.fillColor = [255, 200, 200];
                            data.cell.styles.textColor = [150, 0, 0];
                        }
                    }
                },
                didDrawPage: function(data) {
                    // Add footer on each page
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
                    
                    // Add page number
                    pdf.text(
                        `Page ${data.pageNumber} of ${pdf.internal.getNumberOfPages()}`,
                        15,
                        pageHeight - 10
                    );
                    
                    // Add generation date
                    pdf.text(
                        `Generated: ${new Date().toLocaleDateString()}`,
                        pageWidth - 60,
                        pageHeight - 10
                    );
                },
                margin: { top: 25, left: 10, right: 10, bottom: 15 },
            });
    
            // Add summary at the bottom of the last page
            const lastPage = pdf.internal.getNumberOfPages();
            pdf.setPage(lastPage);
            pdf.setFontSize(8);
            pdf.setTextColor(0);
    
            // Calculate totals
            const totalEmployees = calendar.length;
            const summary = `Total Employees: ${totalEmployees}`;
            pdf.text(summary, 15, pageHeight - 20);
    
            // Save the PDF
            pdf.save(`Attendance_${duration.getFullYear()}_${duration.getMonth() + 1}.pdf`);
            message.success('PDF exported successfully');
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            message.error("Failed to export PDF file");
        } finally {
            setExportLoading(false);
        }
    };
    

    const exportToExcel = async () => {
        try {
            setExportLoading(true);
            const { calendar } = createCalendarData();
            if (calendar.length === 0) {
                message.warning("No attendance data available to export.");
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Attendance Logs');
            const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();

            // Define columns
            const columns = [
                { header: 'Employee Code', key: 'EmployeeCode' },
                { header: 'Employee Name', key: 'EmployeeName' },
                { header: 'Gender', key: 'Gender' },
                { header: 'Designation', key: 'Designation' }
            ];

            // Add day columns
            for (let day = 1; day <= daysInMonth; day++) {
                const dayName = getDayName(duration.getFullYear(), duration.getMonth(), day);
                columns.push({ 
                    header: `${dayName}\n${day}`, 
                    key: `day${day}`,
                    width: 10 // Adjusted width to accommodate day name
                });
            }

            // Set the columns
            worksheet.columns = columns.map(col => ({
                ...col,
                width: col.header.length + 2
            }));

            // Style the header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add data rows
            calendar.forEach(employee => {
                const rowData = {
                    EmployeeCode: employee.EmployeeCode || '',
                    EmployeeName: employee.EmployeeName || '',
                    Gender: employee.Gender || '',
                    Designation: employee.Designation || ''
                };

                // Add attendance status for each day
                for (let day = 1; day <= daysInMonth; day++) {
                    rowData[`day${day}`] = employee[`day${day}`] || 'N/A';
                }

                const row = worksheet.addRow(rowData);

                // Style attendance cells
                for (let day = 1; day <= daysInMonth; day++) {
                    const cell = row.getCell(`day${day}`);
                    if (cell.value === 'P') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF90EE90' }
                        };
                    } else if (cell.value === 'A') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF9999' }
                        };
                    }
                }
            });

            // Generate buffer and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Attendance_${duration.getFullYear()}_${duration.getMonth() + 1}.xlsx`;
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
                        <div style={{ marginTop: '5px', marginBottom: '15px' }}>
                            <Space>
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
                            </Space>
                        </div>
                        <Table
                            dataSource={calendar}
                            columns={columns}
                            pagination={false}
                            rowKey="EmployeeCode"
                            bordered
                            scroll={{ x: 'max-content' }}
                        />
                        <div>{actions}</div>
                    </Card>
                ) : (
                    <Empty />
                )}
            </Col>
        </Row>
    );
}
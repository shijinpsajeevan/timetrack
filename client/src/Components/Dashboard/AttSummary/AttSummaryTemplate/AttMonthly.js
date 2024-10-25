import React, { useState, useEffect } from 'react';
import { Col, Card, Row, Empty, message, Button, Table, Space,Input } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined, FileExcelOutlined, FilePdfOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AttMonthly({ locationid, duration }) {
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [activeFilters, setActiveFilters] = useState({});
    const [remarks, setRemarks] = useState({});
    
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

    const clearAllFilters = () => {
        setActiveFilters({});
        setFilteredData([]);
    };

    const calculateTotalPresent = (record) => {
        const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
        let total = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            if (record[`day${day}`] === 'P' || record[`day${day}`] === 'ME') {
                total++;
            }
        }
        return total;
    };

    const handleRemarkChange = (employeeCode, value) => {
        setRemarks(prev => ({
            ...prev,
            [employeeCode]: value
        }));
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
        const columns = [
            { 
                title: 'Employee Code', 
                dataIndex: 'EmployeeCode', 
                key: 'EmployeeCode', 
                width: 150,
                filteredValue: activeFilters.EmployeeCode || null,
                filters: [...new Set(logs.map(log => log.EmployeeCode))].map(code => ({
                    text: code,
                    value: code,
                })),
                onFilter: (value, record) => record.EmployeeCode === value,
            },
            { 
                title: 'Employee Name', 
                dataIndex: 'EmployeeName', 
                key: 'EmployeeName', 
                width: 200,
                filteredValue: activeFilters.EmployeeName || null,
                filters: [...new Set(logs.map(log => log.EmployeeName))].map(name => ({
                    text: name,
                    value: name,
                })),
                onFilter: (value, record) => record.EmployeeName === value,
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
                onFilter: (value, record) => record.Gender === value,
            },
            { 
                title: 'Designation', 
                dataIndex: 'Designation', 
                key: 'Designation', 
                width: 150,
                filteredValue: activeFilters.Designation || null,
                filters: [...new Set(logs.map(log => log.Designation))].map(designation => ({
                    text: designation,
                    value: designation,
                })),
                onFilter: (value, record) => record.Designation === value,
            },
            
        ]
    
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
                    { text: 'Weekly Off', value: 'WO' },
                    { text: 'Manual Entry', value: 'ME' },
                ],
                onFilter: (value, record) => record[`day${day}`] === value,
                render: (status) => (
                    <span style={{ 
                        color: status === 'P' ? 'green' 
                            : status === 'A' ? 'red' 
                            : status === 'WO' ? 'blue'
                            : status === 'ME' ? 'orange'  // Added color for ME
                            : 'black' 
                    }}>
                        {status}
                    </span>
                ),
            });
        }

        
        columns.push(
            { 
                title: 'Total Present', 
                dataIndex: 'totalPresent',
                key: 'totalPresent',
                width: 100,
                fixed: 'right',
                render: (_, record) => calculateTotalPresent(record)
            },
            {
                title: 'Remarks',
                dataIndex: 'remarks',
                key: 'remarks',
                width: 200,
                fixed: 'right',
                render: (_, record) => (
                    <Input
                        placeholder="Enter remarks"
                        value={remarks[record.EmployeeCode] || ''}
                        onChange={(e) => handleRemarkChange(record.EmployeeCode, e.target.value)}
                    />
                )
            }
        );
    
        const groupedLogs = logs.reduce((acc, log) => {
            const { EmployeeCode, EmployeeName, Gender, Designation, LogDate, IsWeeklyOff1, IsWeeklyOff2, WeeklyOff1Day, WeeklyOff2Day, AttendanceMarkingType } = log;
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
    
            // // Mark as Present if log exists
            // acc[EmployeeCode][`day${day}`] = 'P'; 

            // Set attendance status based on AttendanceMarkingType
            acc[EmployeeCode][`day${day}`] = AttendanceMarkingType === 'ME' ? 'ME' : 'P';
    
            // Add Weekly Off logic
            for (let d = 1; d <= daysInMonth; d++) {
                const currentDayName = getDayNameLong(duration.getFullYear(), duration.getMonth(), d); // Get the weekday name
                
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
    
    const handleTableChange = (pagination, filters, sorter) => {

        const hasActiveFilters = Object.values(filters).some(filter => filter && filter.length > 0);

        setActiveFilters(filters); // Store active filters
        const { calendar } = createCalendarData();
        let result = [...calendar];


         if (hasActiveFilters) {
            // Apply all active filters
            Object.keys(filters).forEach(key => {
                const selectedFilters = filters[key];
                if (selectedFilters && selectedFilters.length > 0) {
                    result = result.filter(record => selectedFilters.includes(record[key]));
                }
            });
            setFilteredData(result);
        } else {
            // If no filters are active, reset to original data
            setFilteredData([]);
        }
    };

    
    const getCurrentData = () => {
        const { calendar } = createCalendarData();
        // Return filtered data if there are active filters, otherwise return all data
        return Object.values(activeFilters).some(filter => filter && filter.length > 0)
            ? filteredData
            : calendar;
    };

    

    const getMonthYearString = () => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[duration.getMonth()]} ${duration.getFullYear()}`;
    };

    // const exportToPdf = async () => {
    //     try {
    //         setExportLoading(true);
            
    //         // Use filtered data if available, otherwise use all data
    //         const dataToExport = getCurrentData();
            
    //         if (dataToExport.length === 0) {
    //             message.warning("No attendance data available to export.");
    //             return;
    //         }

    //         const { calendar } = createCalendarData();
    //         if (calendar.length === 0) {
    //             message.warning("No attendance data available to export.");
    //             return;
    //         }
    
    //         const daysInMonth = new Date(duration.getFullYear(), duration.getMonth() + 1, 0).getDate();
    
    //         // Initialize PDF in landscape
    //         const pdf = new jsPDF({
    //             orientation: 'landscape',
    //             unit: 'mm',
    //             format: 'a4'
    //         });
    
    //         // Get page dimensions
    //         const pageWidth = 297;
    //         const pageHeight = 210;
    
    //         // Add title
    //         pdf.setFontSize(12);
    //         const title = `Attendance Report - ${getMonthYearString()}`;
    //         const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
    //         pdf.text(title, (pageWidth - titleWidth) / 2, 10); // Center the title

    //          // Calculate optimal column widths for A4
    //         const margins = { left: 5, right: 5, top: 15, bottom: 10 };
    //         const availableWidth = pageWidth - margins.left - margins.right;

    //         // Define column widths based on available space
    //         const baseColumnWidths = {
    //             employeeCode: 20,    // Employee Code
    //             name: 30,           // Name
    //             gender: 12,         // Gender
    //             designation: 25,    // Designation
    //             totalPresent: 15,   // Total Present
    //             remarks: 25         // Remarks
    //         };

    //             // Calculate remaining width for day columns
    //         const fixedColumnsWidth = Object.values(baseColumnWidths).reduce((a, b) => a + b, 0);
    //         const dayColumnWidth = (availableWidth - fixedColumnsWidth) / daysInMonth;
    
    //         // Prepare headers with day names and day numbers
    //         const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
    //             const dayNum = i + 1;
    //             const dayName = getDayName(duration.getFullYear(), duration.getMonth(), dayNum);
    //             return { content: dayName, rowSpan: 2 }; // Day names row
    //         });
    
    //         const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()); // Day numbers row
    
    //         // Prepare table headers
    //         const headers = [
    //             ['Emp Code', 'Name', 'Gender', 'Designation', 
    //              ...Array.from({ length: daysInMonth }, (_, i) => getDayName(duration.getFullYear(), duration.getMonth(), i + 1)),
    //              'Total Present', 'Remarks'],
    //             ['', '', '', '', 
    //              ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
    //              '', '']
    //         ];
    
    //         // Prepare table data
    //         const tableData = dataToExport.map(employee => [
    //             employee.EmployeeCode || '',
    //             employee.EmployeeName || '',
    //             employee.Gender || '',
    //             employee.Designation || '',
    //             ...Array.from({ length: daysInMonth }, (_, i) => employee[`day${i + 1}`] || 'N/A'),
    //             calculateTotalPresent(employee),
    //             remarks[employee.EmployeeCode] || ''
    //         ]);

           
    
    //         // Calculate column widths based on page size
    //         const fixedColWidths = {
    //             0: 20, // Emp Code
    //             1: 35, // Name
    //             2: 10, // Gender
    //             3: 25, // Designation
    //         };
    
    //         // Calculate remaining width for date columns
    //         const usedWidth = Object.values(fixedColWidths).reduce((a, b) => a + b, 0);
    //         const remainingWidth = pageWidth - 20; // 20mm total margin
    //         const dateColumnWidth = (remainingWidth - usedWidth) / daysInMonth;
    
    //         // Create column styles
    //         const columnStyles = {
    //             0: { cellWidth: fixedColWidths[0] },
    //             1: { cellWidth: fixedColWidths[1] },
    //             2: { cellWidth: fixedColWidths[2] },
    //             3: { cellWidth: fixedColWidths[3] },
    //         };
    
    //         // Add date column styles
    //         for (let i = 4; i < 4 + daysInMonth; i++) {
    //             columnStyles[i] = { cellWidth: dateColumnWidth };
    //             columnStyles[4 + daysInMonth] = { cellWidth: 20 }; // Total Present
    //             columnStyles[5 + daysInMonth] = { cellWidth: 40 }; // Remarks
    //         }
    
    //         // Add the table to the PDF with proper styling
    //         pdf.autoTable({
    //             head: headers,
    //             body: tableData,
    //             startY: 25,
    //             theme: 'grid',
    //             styles: {
    //                 fontSize: 7,
    //                 cellPadding: 1,
    //                 overflow: 'linebreak',
    //                 halign: 'center',
    //                 valign: 'middle',
    //                 minCellHeight: 8,
    //             },
    //             columnStyles: columnStyles,
    //             headStyles: {
    //                 fillColor: [220, 220, 220],
    //                 textColor: [0, 0, 0],
    //                 fontStyle: 'bold',
    //                 fontSize: 7,
    //             },
    //             didParseCell: function(data) {
    //                 // Set background color for status cells
    //                 if (data.section === 'body' && data.column.index >= 4) {
    //                     const value = data.cell.raw;
    //                     if (value === 'P') {
    //                         data.cell.styles.fillColor = [200, 255, 200];
    //                         data.cell.styles.textColor = [0, 100, 0];
    //                     } else if (value === 'A') {
    //                         data.cell.styles.fillColor = [255, 200, 200];
    //                         data.cell.styles.textColor = [150, 0, 0];
    //                     }
    //                     else if (value === 'ME') {  // Add styling for ME
    //                         data.cell.styles.fillColor = [255, 229, 204];  // Light orange background
    //                         data.cell.styles.textColor = [204, 102, 0];    // Dark orange text
    //                     }
    //                 }
    //             },
    //             didDrawPage: function(data) {
    //                 // Add footer on each page
    //                 pdf.setFontSize(8);
    //                 pdf.setTextColor(100);
                    
    //                 // Add page number
    //                 pdf.text(
    //                     `Page ${data.pageNumber} of ${pdf.internal.getNumberOfPages()}`,
    //                     15,
    //                     pageHeight - 10
    //                 );
                    
    //                 // Add generation date
    //                 pdf.text(
    //                     `Generated: ${new Date().toLocaleDateString()}`,
    //                     pageWidth - 60,
    //                     pageHeight - 10
    //                 );
    //             },
    //             margin: { top: 25, left: 10, right: 10, bottom: 15 },
    //         });
    
    //         // Add summary at the bottom of the last page
    //         const lastPage = pdf.internal.getNumberOfPages();
    //         pdf.setPage(lastPage);
    //         pdf.setFontSize(8);
    //         pdf.setTextColor(0);
    
    //         // Calculate totals
    //         const totalEmployees = calendar.length;
    //         const summary = `Total Employees: ${totalEmployees}`;
    //         pdf.text(summary, 15, pageHeight - 20);
    
    //         // Save the PDF
    //         pdf.save(`Attendance_${duration.getFullYear()}_${duration.getMonth() + 1}.pdf`);
    //         message.success('PDF exported successfully');
    //     } catch (error) {
    //         console.error("Error exporting to PDF:", error);
    //         message.error("Failed to export PDF file");
    //     } finally {
    //         setExportLoading(false);
    //     }
    // };
    

    const exportToPdf = async () => {
        try {
            setExportLoading(true);
            
            // Use filtered data if available, otherwise use all data
            const dataToExport = getCurrentData();
            
            if (dataToExport.length === 0) {
                message.warning("No attendance data available to export.");
                return;
            }
    
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
    
            // Define page dimensions and margins
            const pageWidth = pdf.internal.pageSize.width;
            const pageHeight = pdf.internal.pageSize.height;
            const margins = {
                left: 3,
                right: 3,
                top: 25,
                bottom: 15
            };
    
            // Calculate available width for content
            const availableWidth = pageWidth - margins.left - margins.right;
    
            // Define fixed column widths (in mm)
            const columnWidths = {
                employeeCode: Math.floor(availableWidth * 0.05),    // 7% of available width
            name: Math.floor(availableWidth * 0.10),            // 13% of available width
            gender: Math.floor(availableWidth * 0.04),          // 4% of available width
            designation: Math.floor(availableWidth * 0.05),     // 10% of available width
            totalPresent: Math.floor(availableWidth * 0.04),    // 5% of available width
            remarks: Math.floor(availableWidth * 0.07)
            };
    
            // Calculate width for date columns (remaining width divided equally)
            const fixedColumnsWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
            const remainingWidth = availableWidth - fixedColumnsWidth;
            const dateColumnWidth = Math.min(7, Math.floor(remainingWidth / daysInMonth)) + 0.2;
    
            // Add title
            pdf.setFontSize(14);
            const title = `Attendance Report - ${getMonthYearString()}`;
            const titleWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
            pdf.text(title, (pageWidth - titleWidth) / 2, 15);
    
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
    
            // Prepare table data
            const tableData = dataToExport.map(employee => [
                employee.EmployeeCode || '',
                employee.EmployeeName || '',
                employee.Gender || '',
                employee.Designation || '',
                ...Array.from({ length: daysInMonth }, (_, i) => employee[`day${i + 1}`] || 'N/A'),
                calculateTotalPresent(employee),
                remarks[employee.EmployeeCode] || ''
            ]);
    
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
                didParseCell: function(data) {
                    // Style attendance status cells
                    if (data.section === 'body' && data.column.index >= 4 && 
                        data.column.index < 4 + daysInMonth) {
                        const value = data.cell.raw;
                        switch(value) {
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
                        }
                    }
                },
                didDrawPage: function(data) {
                    // Add footer
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
                    
                    // Add page number
                    pdf.text(
                        `Page ${data.pageNumber} of ${pdf.internal.getNumberOfPages()}`,
                        margins.left,
                        pageHeight - margins.bottom
                    );
                    
                    // Add generation date
                    pdf.text(
                        `Generated: ${new Date().toLocaleDateString()}`,
                        pageWidth - 60,
                        pageHeight - margins.bottom
                    );
                },
                margin: margins,
            });
    
            // Add summary on the last page
            const lastPage = pdf.internal.getNumberOfPages();
            pdf.setPage(lastPage);
            pdf.setFontSize(8);
            pdf.setTextColor(0);
    
            const totalEmployees = calendar.length;
            const summary = `Total Employees: ${totalEmployees}`;
            pdf.text(summary, margins.left, pageHeight - 20);
    
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

            const dataToExport = getCurrentData();

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

            columns.push(
                { header: 'Total Present', key: 'totalPresent' },
                { header: 'Remarks', key: 'remarks' }
            );

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
            dataToExport.forEach(employee => {
                const rowData = {
                    EmployeeCode: employee.EmployeeCode || '',
                    EmployeeName: employee.EmployeeName || '',
                    Gender: employee.Gender || '',
                    Designation: employee.Designation || '',
                    ...Array.from({ length: daysInMonth }, (_, i) => ({
                        [`day${i + 1}`]: employee[`day${i + 1}`] || 'N/A'
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
                            fgColor: { argb: 'FF90EE90' }
                        };
                    } else if (cell.value === 'A') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF9999' }
                        };
                    }
                    else if (cell.value === 'ME') {  // Add styling for ME
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFE5CC' }  // Light orange
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
                                {Object.values(activeFilters).some(filter => filter && filter.length > 0) && (
                                <Button 
                                    icon={<ClearOutlined />}
                                    onClick={clearAllFilters}
                                >
                                    Clear All Filters
                                </Button>
                            )}
                            </Space>
                            
                        </div>
                        <Table
                            dataSource={getCurrentData()}
                            columns={columns}
                            pagination={false}
                            rowKey="EmployeeCode"
                            bordered
                            scroll={{ x: 'max-content' }}
                            onChange={handleTableChange}
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
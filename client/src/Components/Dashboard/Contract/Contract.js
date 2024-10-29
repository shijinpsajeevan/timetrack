import React, { useState, useEffect } from 'react';
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  Card,
  Space,
  message,
  Radio,
  Row,
  Col,
  Modal,
  Popconfirm
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Contract = () => {
  const [form] = Form.useForm();
  const [locations, setLocations] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contractType, setContractType] = useState('Monthly');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.post('http://localhost:3003/api/common/getDeviceList', {}, {
        headers: {
          'token': token
        }
      });
      setLocations(response.data);
    } catch (error) {
      message.error('Failed to fetch locations');
      console.error('Error fetching locations:', error);
    }
  };

  const fetchContracts = async (locationId, startDate, endDate) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3003/api/common/getLocationContracts', {
        params: {
          locationId,
          startYear: startDate.year(),
          startMonth: startDate.month() + 1,
          endYear: endDate.year(),
          endMonth: endDate.month() + 1,
          contractType
        },
        headers: {
          'token': token
        }
      });
      setContracts(response.data.contracts);
    } catch (error) {
      message.error('Failed to fetch contracts');
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    const dateRange = values.dateRange;
    const startDate = dateRange[0];
    const endDate = dateRange[1];
    
    const contractData = {
      locationId: values.locationId,
      staffCount: values.staffCount,
      contractType: values.contractType,
      startYear: startDate.year(),
      startMonth: startDate.month() + 1,
      endYear: endDate.year(),
      endMonth: endDate.month() + 1,
      overwrite: true // Always overwrite existing contracts
    };

    await submitContracts(contractData);
  };

  const submitContracts = async (contractData) => {
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:3003/api/common/locationContracts',
        contractData,
        {
          headers: {
            'token': token
          }
        }
      );
      
      if (response.data.success) {
        message.success(response.data.message);
        form.resetFields();
        // Refresh contracts list
        fetchContracts(
          contractData.locationId,
          dayjs().year(contractData.startYear).month(contractData.startMonth - 1),
          dayjs().year(contractData.endYear).month(contractData.endMonth - 1)
        );
      }
    } catch (error) {
      message.error('Failed to add contracts');
      console.error('Error adding contracts:', error);
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
    }
  };

  const handleUpdateContract = async (contract) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:3003/api/common/locationContracts/${contract.contractId}`,
        {
          staffCount: contract.staffCount,
          contractType: contract.contractType
        },
        {
          headers: {
            'token': token
          }
        }
      );
      
      if (response.data.success) {
        message.success('Contract updated successfully');
        setEditingContract(null);
        // Refresh the contracts list
        fetchContracts(
          contract.locationId,
          dayjs().year(contract.year).month(contract.month - 1),
          dayjs().year(contract.year).month(contract.month - 1)
        );
      }
    } catch (error) {
      message.error('Failed to update contract');
      console.error('Error updating contract:', error);
    } finally {
      setLoading(false);
    }
  };

//   const handleDeleteContract = async (contractId) => {
//     try {
//       setLoading(true);
//       const response = await axios.delete(
//         `http://localhost:3003/api/common/locationContracts/${contractId}`,
//         {
//           headers: {
//             'token': token
//           }
//         }
//       );
      
//       if (response.data.success) {
//         message.success('Contract deleted successfully');
//         // Refresh the contracts list
//         const currentContract = contracts.find(c => c.contractId === contractId);
//         if (currentContract) {
//           fetchContracts(
//             currentContract.locationId,
//             dayjs().year(currentContract.year).month(currentContract.month - 1),
//             dayjs().year(currentContract.year).month(currentContract.month - 1)
//           );
//         }
//       }
//     } catch (error) {
//       message.error('Failed to delete contract');
//       console.error('Error deleting contract:', error);
//     } finally {
//       setLoading(false);
//     }
//   };


const handleDeleteContract = async (contractId) => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `http://localhost:3003/api/common/locationContracts/${contractId}`,
        {
          headers: {
            'token': token
          }
        }
      );
  
      if (response.data.success) {
        message.success('Contract deleted successfully');
  
        // Update contracts state by removing the deleted contract immediately
        setContracts(prevContracts => 
          prevContracts.filter(contract => contract.contractId !== contractId)
        );
  
        // Optionally re-fetch contracts to ensure the latest data
        const currentContract = contracts.find(c => c.contractId === contractId);
        if (currentContract) {
          fetchContracts(
            currentContract.locationId,
            dayjs().year(currentContract.year).month(currentContract.month - 1),
            dayjs().year(currentContract.year).month(currentContract.month - 1)
          );
        }
      }
    } catch (error) {
      message.error('Failed to delete contract');
      console.error('Error deleting contract:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const columns = [
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName'
    },
    {
      title: 'Contract Type',
      dataIndex: 'contractType',
      key: 'contractType'
    },
    {
      title: 'Staff Count',
      dataIndex: 'staffCount',
      key: 'staffCount',
      render: (text, record) => (
        editingContract?.contractId === record.contractId ? (
          <InputNumber
            min={1}
            defaultValue={text}
            onChange={value => {
              setEditingContract({
                ...editingContract,
                staffCount: value
              });
            }}
          />
        ) : text
      )
    },
    {
      title: 'Month/Year',
      key: 'monthYear',
      render: (_, record) => `${record.month}/${record.year}`
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {editingContract?.contractId === record.contractId ? (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateContract(editingContract)}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => setEditingContract(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="small"
                onClick={() => setEditingContract(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this contract?"
                onConfirm={() => handleDeleteContract(record.contractId)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" danger>Delete</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('month');
  };

  return (
    <div className="p-6">
      <Card title="Location Contract Management">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSubmit}
          initialValues={{ contractType: 'Monthly' }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="locationId"
                label="Location"
                rules={[{ required: true, message: 'Please select a location' }]}
              >
                <Select
                  placeholder="Select location"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {locations.map((location) => (
                    <Option key={location.DeviceId} value={location.DeviceId}>
                      {location.DeviceFName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="contractType"
                label="Contract Type"
                rules={[{ required: true }]}
              >
                <Radio.Group onChange={(e) => setContractType(e.target.value)}>
                  <Radio.Button value="Monthly">Monthly</Radio.Button>
                  <Radio.Button value="Daily">Daily</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="staffCount"
                label="Staff Count"
                rules={[{ required: true, message: 'Please enter staff count' }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>
            </Col>
          
            <Col span={6}>
              <Form.Item
                name="dateRange"
                label="Select Date Range"
                rules={[{ required: true, message: 'Please select date range' }]}
              >
                <RangePicker
                  picker="month"
                  className="w-full"
                  onChange={(dates) => {
                    if (dates && form.getFieldValue('locationId')) {
                      fetchContracts(
                        form.getFieldValue('locationId'),
                        dates[0],
                        dates[1]
                      );
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Contracts
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Existing Contracts">
        <Table
          columns={columns}
          dataSource={contracts}
          loading={loading}
          rowKey="contractId"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Contract;
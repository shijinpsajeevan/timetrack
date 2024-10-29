import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Tag,
  Tooltip,
  Popconfirm
} from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Header, Content } = Layout;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3003';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/users`, {
        headers: { token: localStorage.getItem('token') }
      });
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      FirstName: user?.FirstName || '',
      LastName: user?.LastName || '',
      UserMail: user?.UserMail || '',
      Company: user?.Company || '',
      UserType: user?.UserType || 'User',
      IsAdmin: user?.IsAdmin || false,
      IsSuperAdmin: user?.IsSuperAdmin || false
    });
    setEditModalVisible(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    form.resetFields();
    form.setFieldsValue({
      UserType: 'User',
      IsAdmin: false,
      IsSuperAdmin: false
    });
    setEditModalVisible(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    passwordForm.resetFields();
    setResetPasswordModalVisible(true);
  };

  const handleUpdateUser = async (values) => {
    try {
      if (selectedUser) {
        await axios.put(
          `${API_BASE_URL}/api/auth/users/${selectedUser.UserID}`,
          values,
          { headers: { token: localStorage.getItem('token') } }
        );
        message.success('User updated successfully');
      } else {
        await axios.post(
          `${API_BASE_URL}/api/auth/users`,
          values,
          { headers: { token: localStorage.getItem('token') } }
        );
        message.success('User created successfully');
      }
      setEditModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Operation failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleActive = async (userId, active) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/users/${userId}/active`,
        { active },
        { headers: { token: localStorage.getItem('token') } }
      );
      message.success('User status updated successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user status: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleResetUserPassword = async (values) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/users/${selectedUser.UserID}/password`,
        values,
        { headers: { token: localStorage.getItem('token') } }
      );
      message.success('Password reset successfully');
      setResetPasswordModalVisible(false);
    } catch (error) {
      message.error('Failed to reset password: ' + (error.response?.data?.error || error.message));
    }
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.FirstName} ${record.LastName}`,
      sorter: (a, b) => `${a.FirstName} ${a.LastName}`.localeCompare(`${b.FirstName} ${b.LastName}`)
    },
    {
      title: 'Email',
      dataIndex: 'UserMail',
      key: 'email',
      sorter: (a, b) => a.UserMail.localeCompare(b.UserMail)
    },
    {
      title: 'Company',
      dataIndex: 'Company',
      key: 'company',
      sorter: (a, b) => (a.Company || '').localeCompare(b.Company || '')
    },
    {
      title: 'User Type',
      dataIndex: 'UserType',
      key: 'userType',
      render: (type) => (
        <Tag color={type === 'Admin' ? 'blue' : type === 'superAdmin' ? 'purple' : 'green'}>
          {type}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'Admin' },
        { text: 'Super Admin', value: 'superAdmin' },
        { text: 'User', value: 'User' }
      ],
      onFilter: (value, record) => record.UserType === value
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.Active ? 'green' : 'red'}>
          {record.Active ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false }
      ],
      onFilter: (value, record) => record.Active === value
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit User">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Reset Password">
            <Button 
              icon={<LockOutlined />} 
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          <Tooltip title={record.Active ? "Deactivate" : "Reactivate"}>
            <Popconfirm
              title={`Are you sure you want to ${record.Active ? 'deactivate' : 'reactivate'} this user?`}
              onConfirm={() => handleToggleActive(record.UserID, !record.Active)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                icon={record.Active ? <DeleteOutlined /> : <UndoOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <h1>User Management</h1>
      </Header>
      <Content style={{ padding: '24px', minHeight: '280px' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add New User
          </Button>
        </div>
        
        <Table 
          columns={columns}
          dataSource={users}
          rowKey="UserID"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`
          }}
        />

        <Modal
          title={selectedUser ? "Edit User" : "Add New User"}
          visible={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateUser}
          >
            <Form.Item
              name="FirstName"
              label="First Name"
              rules={[{ required: true, message: 'Please input the first name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="LastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please input the last name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="UserMail"
              label="Email"
              rules={[
                { required: true, message: 'Please input the email!' },
                { type: 'email', message: 'Please input a valid email!' }
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Company"
              label="Company"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="UserType"
              label="User Type"
              rules={[{ required: true, message: 'Please select the user type!' }]}
            >
              <Select>
                <Option value="User">User</Option>
                <Option value="Admin">Admin</Option>
                <Option value="superAdmin">Super Admin</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="IsAdmin"
              valuePropName="checked"
              label="Admin Access"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="IsSuperAdmin"
              valuePropName="checked"
              label="Super Admin Access"
            >
              <Switch />
            </Form.Item>
            {!selectedUser && (
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input the password!' }]}
              >
                <Input.Password />
              </Form.Item>
            )}
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {selectedUser ? 'Update' : 'Create'}
                </Button>
                <Button onClick={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Reset Password"
          visible={resetPasswordModalVisible}
          onCancel={() => setResetPasswordModalVisible(false)}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleResetUserPassword}
          >
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please input the new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm the password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Reset Password
                </Button>
                <Button onClick={() => setResetPasswordModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default UserManagement;
import React from 'react';
import { Layout, Menu, Breadcrumb, Table, Statistic, Card, Row, Col, Button } from 'antd';
import { UserOutlined, PieChartOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import logo from '../../Images/azzurro.jpg'; // Add your logo image path here

const { Header, Content, Sider, Footer } = Layout;

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
  },
];

const data = [
  {
    key: '1',
    name: 'John Doe',
    date: '2024-10-10',
    status: 'Present',
  },
  {
    key: '2',
    name: 'Jane Smith',
    date: '2024-10-10',
    status: 'Absent',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    navigate('/login'); // Redirect to login page
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <img src={logo} alt="Logo" style={{ width: '120px', marginBottom: '16px' }} />
        </div>
        <Menu theme="dark" mode="inline">
          <Menu.Item key="1" icon={<PieChartOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            Users
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          </Breadcrumb>

          {/* Logout Button */}
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="primary">
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
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
          <Table columns={columns} dataSource={data} style={{ marginTop: '16px' }} />
        </Content>

        <Footer style={{ textAlign: 'center' }}>Attendance Dashboard ©2024</Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

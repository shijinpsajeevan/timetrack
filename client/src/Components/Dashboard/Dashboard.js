import React, {useState} from 'react';
import { Layout, Menu, Breadcrumb, Table, Statistic, Card, Row, Col, Button, theme, Space } from 'antd';
import { UserOutlined, PieChartOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate , Link, Outlet} from 'react-router-dom';
import logo from '../../Images/azzurro.jpg'; // Add your logo image path here
import { useUser } from './UserProvider';
import Users from '../Users/Users';


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
  const { menus } = useUser(); // Access menus from context
  const userName = localStorage.getItem('userName');

  //Default component for loading
  const [currentComponent, setCurrentComponent] = useState(<Users />);

  const menuNavigate=(e)=>{
    
    // navigate(`/${e.key}`); 
    // Update the current component based on the selected key
    switch (e.key) {
        case 'users':
          setCurrentComponent(<Users />);
          break;
        case 'dashboard': // Change 'another' to the key of another component
          setCurrentComponent(<Dashboard />);
          break;
        default:
          setCurrentComponent(<Users />); // Default to Users component
      }
  }

  console.log('Menus:', menus);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    localStorage.removeItem('userType');
    navigate('/login'); // Redirect to login page
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <img src={logo} alt="Logo" style={{ width: '120px', marginBottom: '16px' }} />
        </div>
        
        <Menu theme="light" mode="inline" items={menus} onClick={menuNavigate}>
                {/* {menus.map((item) => {
                    // Check if item has children
                    if (item.children) {
                        return (
                            <Menu.SubMenu key={item.key} icon={item.icon} title={item.label} mode="inline">
                                {item.children.map((child) => (
                                    <Menu.Item key={child.key} icon={child.icon}>
                                        <Link to={`/${child.key}`}>{child.label}</Link>
                                    </Menu.Item>
                                ))}
                            </Menu.SubMenu>
                        );
                    }
                    return (
                        <Menu.Item key={item.key} icon={item.icon}>
                            <Link to={`/${item.key}`}>{item.label}</Link>
                        </Menu.Item>
                    );
                })} */}
            </Menu>

      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
          <Space direction='horizontal' ><UserOutlined/> {userName}</Space>
          </Breadcrumb>
          {/* Logout Button */}
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="primary">
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '16px' }}>
            
          {/* <Row gutter={[16, 16]}>
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
          </Row> */}
          {/* <Table columns={columns} dataSource={data} style={{ marginTop: '16px' }} /> */}

            {currentComponent} 
          
          
        </Content>
        

        <Footer style={{ textAlign: 'center' }}>Attendance Dashboard ©2024</Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

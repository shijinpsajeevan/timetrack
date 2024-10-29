import React, {useState, useEffect} from 'react';
import { Button, Layout, Menu, Breadcrumb, Table, Statistic, Card, Row, Col, theme, Space, Tooltip  } from 'antd';
import { UserOutlined, LayoutFilled, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate , Link, Outlet} from 'react-router-dom';
import logo from '../../Images/azzurro.jpg'; // Add your logo image path here
import { useUser } from './UserProvider';
import AttSummary from './AttSummary/AttSummary';
import Users from '../Users/Users';
import Regularize from './Regularize/Regularize';
import axios from 'axios';


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
  const [isVerified,setIsVerified]= useState(false);
  const [collapsed,setCollapsed] = useState(false);


  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    
    const verifyToken = async () =>{
        try {
            const token = localStorage.getItem('token');
            if(!token)
            {
                navigate('/login');
            }

            const response = await axios.get('http://localhost:3003/api/auth/is-verify', {
                headers: { token: token } 
              });

              if (response.data === true) {
                setIsVerified(true);
              } else {
                localStorage.removeItem("token");
                navigate('/login');
              }

        } catch (error) {
            console.error("Verification failed:", error);
            localStorage.removeItem('token');
            window.location.reload();
        // localStorage.removeItem("token");
        // navigate('/login'); // Token is invalid, redirect to login
        }
    }

    verifyToken();
  },[navigate])


  


  const { menus } = useUser(); // Access menus from context
  const userName = localStorage.getItem('userName');
  const lastName = localStorage.getItem('lastName');

  //Default component for loading
  const [currentComponent, setCurrentComponent] = useState(<AttSummary />);

  const menuNavigate=(e)=>{
    
    // navigate(`/${e.key}`); 
    // Update the current component based on the selected key
    switch (e.key) {
        case 'users':
          setCurrentComponent(<Users />);
          break;
        case 'dashboard': // Change 'another' to the key of another component
          setCurrentComponent(<AttSummary />);
          break;
        case 'regularize':
          setCurrentComponent(<Regularize />);
          break;
        default:
          setCurrentComponent(<AttSummary />); // Default to Users component
      }
  }


  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token
    localStorage.removeItem('userType');
    navigate('/login'); // Redirect to login page
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} >
        <div style={{ padding: '16px', textAlign: 'center' }}>
        <img
      src={logo}
      alt="Logo"
      style={{
        width: collapsed ? '40px' : '120px', // Adjust the width based on the collapsed state
        transition: 'width 0.2s', // Smooth transition for width change
        marginBottom: '16px'
      }}
    />
        </div>
        <Tooltip placement='right' title={collapsed?'Maximize Side Menu':'Minimize Side Menu'}>
        {/* <Button  onClick={toggleCollapsed} style={{ marginBottom: 16 }}>
        {collapsed ? <MenuUnfoldOutlined /> :  <MenuFoldOutlined />}
      </Button> */}
        </Tooltip>
        
        <Menu theme="light" mode="inline" items={menus} onClick={menuNavigate} inlineCollapsed={collapsed} >
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
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' , height:'32px'}}>
          <Breadcrumb style={{ margin: '8px 0' }}>
          <Space direction='horizontal' ><UserOutlined/> {userName +' '+lastName}</Space>
          </Breadcrumb>
          {/* Logout Button */}
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text">
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '16px'}}>
            
          

            {currentComponent} 
          
          
        </Content>
        

        <Footer style={{ textAlign: 'center' , height:"2vh"}}>RIS DMCC, Attendance Dashboard &copy; {new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

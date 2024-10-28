import React, { useEffect } from 'react';
import { Layout, Form, Input, Button, Typography, Row, Col, Space, Divider, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../Dashboard/UserProvider';

const { Header, Footer, Content } = Layout;
const { Title, Text } = Typography;

const headerStyle = {
  textAlign: 'center',
  fontSize: '16px',
  lineHeight: '64px',
  background: 'none',
  color: '#5f9bf1'
};

const footerStyle = {
  textAlign: 'center',
  background: 'none'
};

const layoutStyle = {
  borderRadius: '16px',
  overflow: 'hidden',
  width: '90%', // Set width to a percentage to make it responsive
  maxWidth: '400px', // Set a max width to keep the form compact
  margin: '20px auto', // Reduced margin for smaller screens
  padding: '20px',
  backgroundColor: '#fdfdfd',
  backgroundImage: 'linear-gradient(to top, rgba(253, 253, 253, 0.3) 0%, rgba(193, 218, 255, 0.3) 100%)',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
};

const LoginForm = () => {
  const navigate = useNavigate();
  const { setUserRole, setUser } = useUser();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/login', {
        email: values.userEmail,
        password: values.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', response.data.userType);
      localStorage.setItem('userName', response.data.firstName);
      localStorage.setItem('lastName',response.data.lastName);
      localStorage.setItem('designation',response.data.designation);
      setUserRole(response.data.userType);

      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data || 'Login failed. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Layout style={{
      backgroundColor: '#fdfdfd',
      backgroundImage: 'linear-gradient(to top, rgba(253, 253, 253, 0.3) 0%, rgba(193, 218, 255, 0.3) 100%)',
      minHeight: '100vh', // Ensure full height coverage
      overflow: 'hidden' // Prevent scrolling
    }}>
      <Header style={headerStyle}>
        <Title level={4} style={{ color: '#5f9bf1' }}>RIS Attendance PRO v3.0</Title>
      </Header>
      <Content>
        <div style={layoutStyle}>
          <Divider>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '8px' }}>
              Login
            </Title>
          </Divider>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
          >
            <Form.Item
              label="Email ID"
              name="userEmail"
              rules={[{ required: true, message: 'Please input your userEmail!' }]}
            >
              <Input placeholder="Enter your userEmail" prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password placeholder="Enter your password" />
            </Form.Item>

            <Row justify="space-between">
              <Col>
                <Form.Item>
                  <Button type="link" htmlType="button">
                    Forgot Password?
                  </Button>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Login
              </Button>
            </Form.Item>

            <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
              <Text>Don't have an account?</Text>
              <Button type="default" block>
                Register
              </Button>
            </Space>
          </Form>
        </div>
      </Content>
      <Footer style={footerStyle}>
        Azzurro Facilities Management LLC. All rights reserved.
      </Footer>
    </Layout>
  );
};

export default LoginForm;

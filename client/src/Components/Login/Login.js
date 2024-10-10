import React, {useEffect} from 'react';
import { Layout, Form, Input, Button, Typography, Row, Col, Space, Divider, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // Use react-router for navigation
import axios from 'axios'; // Import axios for API requests

const { Header, Footer, Content } = Layout;
const { Title, Text } = Typography;

const headerStyle = {
  textAlign: 'center',
  fontSize: '1.1rem',
  color: '#08979c',
  height: 64,
  lineHeight: '64px',
  background:'rgb(199, 209, 220)'
};

const footerStyle = {
  textAlign: 'center',
  color: '#fff',
  background: 'rgb(199, 209, 220)'
};

const layoutStyle = {
  borderRadius: '16px',
  overflow: 'hidden',
  width: '400px',
  margin: '100px auto',
  padding: '40px',
  background: '#fff',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
};

const LoginForm = () => {
  const navigate = useNavigate(); // Hook for navigation

   // Check for token in localStorage and redirect if logged in
   useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to dashboard or main page
      navigate('/dashboard'); // Replace with your protected route
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      // Call the login API
      const response = await axios.post('http://localhost:3003/api/auth/login', {
        email: values.userEmail, // Assuming "userEmail" is an email
        password: values.password
      });

      // Store the JWT token in localStorage or cookies
      localStorage.setItem('token', response.data.token);

      // Show success message
      message.success('Login successful!');
      
        // Redirect to dashboard or main page
        navigate('/dashboard'); // Replace with your route

    } catch (error) {
      // Handle error (e.g., incorrect login credentials)
      message.error(error.response?.data || 'Login failed. Please try again.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'rgb(199, 209, 220)' }}>
      <Header style={headerStyle}>
        <Title level={3}>RIS Attendance PRO v3.0</Title>
      </Header>
      <Content>
        <div style={layoutStyle}>
          <Divider>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '24px' }}>
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

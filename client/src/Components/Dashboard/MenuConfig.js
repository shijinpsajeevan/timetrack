import { UserOutlined, PieChartOutlined, LogoutOutlined } from '@ant-design/icons';
const MenuConfig = {
    superAdmin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'users', label: 'Users', icon: <UserOutlined /> },
        {
            key: 'Managers', label: 'Managers', icon: <UserOutlined />, children: [
                { key: 'users', label: 'Users', icon: <UserOutlined /> }
            ]
        },
        // Add more admin menu items here
    ],
    Admin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'users', label: 'Users', icon: <UserOutlined /> },
        {
            key: 'Managers', label: 'Managers', icon: <UserOutlined />, children: [
                { key: 'abc', label: 'ABC', icon: <UserOutlined /> }
            ]
        }
    ],
    user: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        // Add user-specific menu items here
    ],
    // Add more roles if needed
};
export default MenuConfig;

import { UserOutlined, PieChartOutlined, LogoutOutlined, AppstoreAddOutlined, FormOutlined,FileTextOutlined  } from '@ant-design/icons';
const MenuConfig = {
    superAdmin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'users', label: 'User Management', icon: <UserOutlined /> },
        { key: 'password', label: 'Reset Request', icon: <UserOutlined /> },
        { key: 'regularize', label: 'Regularization', icon: <AppstoreAddOutlined /> },
        { key: 'contractVolume', label: 'Contract Volume', icon: <FormOutlined /> },
        { key: 'customReport', label: 'Custom Reports', icon: <FileTextOutlined  /> },
        {
            key: 'Managers', label: 'Managers', icon: <UserOutlined />, children: [
                { key: 'users', label: 'Users', icon: <UserOutlined /> }
            ]
        },
        // Add more admin menu items here
    ],
    Admin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'regularize', label: 'Regularization', icon: <AppstoreAddOutlined /> },
        { key: 'contractVolume', label: 'Contract Volume', icon: <FormOutlined /> },
        { key: 'customReport', label: 'Custom Reports', icon: <FileTextOutlined  /> },
        // {
        //     key: 'Managers', label: 'Managers', icon: <UserOutlined />, children: [
        //         { key: 'abc', label: 'ABC', icon: <UserOutlined /> }
        //     ]
        // }
    ],
    user: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        // Add user-specific menu items here
    ],
    // Add more roles if needed
};
export default MenuConfig;

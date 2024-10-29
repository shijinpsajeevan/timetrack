import { UserOutlined, PieChartOutlined, LogoutOutlined, AppstoreAddOutlined, FormOutlined,FileTextOutlined  } from '@ant-design/icons';
const MenuConfig = {
    superAdmin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'userManagement', label: 'User Management', icon: <UserOutlined /> },
        { key: 'regularize', label: 'Regularization', icon: <AppstoreAddOutlined /> },
        { key: 'contract', label: 'Contract Volume', icon: <FormOutlined /> },
        {key:'designationReport',label:'DesignationReport', icon:<FileTextOutlined/>},
        // Add more admin menu items here
    ],
    Admin: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        { key: 'regularize', label: 'Regularization', icon: <AppstoreAddOutlined /> },
        { key: 'contract', label: 'Contract Volume', icon: <FormOutlined /> },
        {key:'designationReport',label:'DesignationReport', icon:<FileTextOutlined/>},
   
        // {
        //     key: 'Managers', label: 'Managers', icon: <UserOutlined />, children: [
        //         { key: 'abc', label: 'ABC', icon: <UserOutlined /> }
        //     ]
        // }
    ],
    user: [
        { key: 'dashboard', label: 'Dashboard', icon: <PieChartOutlined /> },
        {key:'designationReport',label:'DesignationReport', icon:<FileTextOutlined/>},
        // Add user-specific menu items here
    ],
    // Add more roles if needed
};
export default MenuConfig;

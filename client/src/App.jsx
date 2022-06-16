import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate
} from "react-router-dom";
import 'antd/dist/antd.css';
import { Badge, Menu, Spin } from 'antd';

import { Layout } from 'antd';

import { useGetUserQuery, useGetAllUsersQuery } from './queries/user'
import { useGetAllDealsQuery } from './queries/deal'

import './App.css'
import CatalogPage from "./pages/Catalog";
import DealPage from "./pages/Deal";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import React, { useEffect } from "react";
import Header from "./components/Header";
import Sider from "./components/Sider";
import ProfilePage from "./pages/Profile";
import User from "./pages/User";
import EditUserPage from "./pages/EditUser";
import UsersPage from "./pages/Users";
import UsersToApprove from "./pages/UsersToApprove";

import {
  AlertOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  StockOutlined,
  PieChartOutlined,
  BarsOutlined
} from '@ant-design/icons';
import NewDealPage from "./pages/NewDeal";
import OwnCatalogPage from "./pages/OwnCatalog";
import DealsApprovePage from "./pages/DealsApprove";
import DealsStagesApprovePage from "./pages/DealsStagesApprove";
import InvestmentsPage from "./pages/Investments";

const { Content } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation()

  const {data: deals, isLoading: isDealsLoading} = useGetAllDealsQuery()
  let {data: user, isLoading, isError} = useGetUserQuery()

  user = isError ? undefined : user

  const isUser = user?.Role === 0
  const isModerator = user?.Role === 1
  const isAdmin = user?.Role === 2

  const {data: users, isLoading: isAllUsersLoading}= useGetAllUsersQuery({
    skip: isUser || !user
  })

  const usersToApprove = users?.filter(({WantPromotion, IsPromoted}) => WantPromotion && !IsPromoted)

  const userItems = [
    [AlertOutlined, 'Проекты и сделки', '/'],
    ...(user?.IsPromoted || isModerator || isAdmin ? [[StockOutlined, 'Создать проект или сделку', `/deal/create`]] : []),
    ...(user?.IsPromoted || isModerator || isAdmin ? [[WalletOutlined, 'Мои проекты и сделки', `/user/${user?.ID}/deals`]] : [])
  ].map(
    ([icon, title, url], index) => {
      let count = url.includes(`/user/${user?.ID}/deals`) ? user?.DealsOwned.length : 0

      return {
        key: url,
        icon: <Badge size='small' count={count}>{React.createElement(icon)}</Badge>,
        label: title,
      };
    },
  );

  const moderatorItems = [
    [UserOutlined, 'Пользователи', '/users'],
    [ExclamationCircleOutlined, 'Заявки на потдверждение пользователей', '/users/approve'],
    [CopyOutlined, 'Заявки на подтверждение сделки', '/deals/approve'],
    [ClockCircleOutlined, 'Заявки на подтверждение этапа сделки', '/deals/stages/approve']
  ].map(
    ([icon, title, url], index) => {
      let count = url.includes('/users/approve') ? usersToApprove?.length: null
      count = url.includes('/deals/approve') ? deals?.filter((deal) => !deal.IsApproved).length : count
      count = url.includes('/deals/stages/approve') ? deals?.flatMap(({Stages}) => Stages).filter(({IsSubmited}) => IsSubmited).length: count

      return {
        key: url,
        icon: <Badge size='small' count={count}>{React.createElement(icon)}</Badge>,
        label: title,
      };
    },
  );

  const adminItems = [].map(
    ([icon, title, url], index) => {
      return {
        key: url,
        icon: <Badge>{React.createElement(icon)}</Badge>,
        label: title,
      };
    },
  );
  
  useEffect(() => {
    if (isError && !location.pathname.includes('login') && !location.pathname.includes('register')) {
      navigate('/login')
    }
  }, [isError, isLoading, location.pathname, navigate, user])

  if (isLoading || isAllUsersLoading) {
    return <Spin className="main-spinner" size="large" />
  }

  return (
    <Layout className="root-layout">
      <Header user={user} />
      <Layout>
        {
          user ? <Sider width={350} user={user}>
          <Menu
            selectedKeys={[location.pathname]}
            onClick={({key}) => navigate(key)}
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            items={[...(isUser || isModerator || isAdmin ? userItems : []) , ...(isModerator || isAdmin ? moderatorItems : []), ...(isAdmin ? adminItems: [])]}
          />
        </Sider>: null
        }
        
        <Content className="content">
          <Routes>
            {
              user ? <>
                <Route path="/" element={<CatalogPage user={user} />} />
                <Route path="/deal/create" element={<NewDealPage user={user} />} />
                <Route path="/deal/:id" element={<DealPage users={users} user={user} />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
                <Route path="/user/:id/edit" element={<EditUserPage user={user} />} />
                <Route path="/user/:id/deals" element={<OwnCatalogPage user={user} />} />
                <Route path="/user/:id/investments" element={<InvestmentsPage user={user} />} />
                <Route path="/user/:id" element={<User user={user} />} />
              </>: null
            }
            {
              user && user.role !== 0 ? <>
                <Route path="/users" element={<UsersPage user={user} />} />
                <Route path="/users/approve" element={<UsersToApprove user={user} />} />
                <Route path="/deals/approve" element={<DealsApprovePage user={user} />} />
                <Route path="/deals/stages/approve" element={<DealsStagesApprovePage user={user} />} />
              </>: null
            }
            <Route path="/login" element={<LoginPage user={user} />} />
            <Route path="/register" element={<RegisterPage user={user} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

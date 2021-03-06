import { Button, PageHeader, Space, Input, Tag, Rate, Menu, DatePicker, Typography, Spin } from "antd";
import { Link } from "react-router-dom";
import SmallDealCard from "../../components/SmallDealCard";
import { useGetAllDealsQuery } from '../../queries/deal';

import {
    SearchOutlined
  } from '@ant-design/icons';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function OwnCatalogPage({user}) {
    const {data, isLoading: isDealsLoading} = useGetAllDealsQuery()

    const deals = useMemo(() => {
        return data?.filter(({UserID}) => user.ID === UserID)
    }, [data, user])

    const [isCheatLoading, setIsCheatLoading] = useState(false)
    const [filteredDeals, setFilteredDeals] = useState([])
    const [dateRange, setDateRange] = useState([undefined, undefined])

    const [filters, setCurrentFilters] = useState([]);
    const [search, setSearch] = useState('');
    const isLoading = isCheatLoading || isDealsLoading

    const updateData = useCallback(() => {
        if (!deals) {
            return
        }

        setIsCheatLoading(true)
        
        let newFilteredDeals = [...deals]
        
        const [firstDate, secondDate] = dateRange
        
        if (firstDate && secondDate) {
            newFilteredDeals = newFilteredDeals.filter(({FinishDate}) => {
                const date = new Date(FinishDate)
                
                return firstDate.toDate() < date && date < secondDate.toDate()
            })
        }
        
        newFilteredDeals = newFilteredDeals.filter(({Title, Description}) => {
            return Title.includes(search) || Description.includes(search)
        })
        
        newFilteredDeals = newFilteredDeals.filter(({Title, Description}) => {
            return Title.includes(search) || Description.includes(search)
        })
        
        const statusesToCheck = filters.filter((filter) => filter.includes('status'))
        .map(filter => filter.split('-')[1])
        
        newFilteredDeals = statusesToCheck.length ? newFilteredDeals.filter(({IsStarted, IsApproved, IsFrozen, IsFinished}) => {
            console.log()
            return (statusesToCheck.includes('started') && IsStarted) ||
            (statusesToCheck.includes('approved') && IsApproved) ||
            (statusesToCheck.includes('frozen') && IsFrozen) ||
            (statusesToCheck.includes('finished') && IsFinished) ||
            (statusesToCheck.includes('default') && !IsStarted && !IsApproved && !IsFrozen && !IsFinished)
        }) : newFilteredDeals
        
        const sort = filters.find((filter) => filter.includes('sort'))
        
        if (sort) {
            const direction = sort.split('-')[2]
            const numberComparator = (a, b) => direction === 'asc' ? a < b : a > b
            
            if (sort.includes('risk')) {
                newFilteredDeals.sort(({Rates: Rates1}, {Rates: Rates2}) => {
                    const rate1 =  Rates1.length ? Rates1.reduce((acc, {Rate}) => acc + Rate, 0) / Rates1.length : 0
                    const rate2 =  Rates2.length ? Rates2.reduce((acc, {Rate}) => acc + Rate, 0) / Rates2.length : 0
                    return numberComparator(rate1, rate2)
                })
            } else if (sort.includes('money')) {
                newFilteredDeals.sort(({Investments: Investments1}, {Investments: Investments2}) => {
                    const currentBalance1 = Investments1.reduce((acc, {Amount}) => acc + Amount, 0)
                    const currentBalance2 = Investments2.reduce((acc, {Amount}) => acc + Amount, 0)
                    return numberComparator(currentBalance1, currentBalance2)
                })
            } else if (sort.includes('inv')) {
                newFilteredDeals.sort(({Investors: Investors1}, {Investors: Investors2}) => {
                    return numberComparator(Investors1.length, Investors2.length)
                })
            }
        }
        
        setTimeout(() => {
            setFilteredDeals(newFilteredDeals)
            setIsCheatLoading(false)
        }, 200)
    }, [deals, dateRange, filters, search])

    const updateDataRef = useRef(updateData)

    useEffect(() => {
        updateDataRef.current = updateData
    }, [updateData])

    useEffect(() => {
        if (deals) {
            updateData()
        }
    }, [deals])

    const items = [
        {
            label: '????????????',
            children: [
                {
                    label: <span style={{color: 'green'}}>????????????????</span>,
                    key: 'status-finished',
                },
                {
                    label: <span style={{color: 'blue'}}>??????????????????</span>,
                    key: 'status-frozen',
                },
                {
                    label: <span style={{color: 'green'}}>??????????????????????</span>,
                    key: 'status-approved',
                },
                {
                    label: <span style={{color: 'gray'}}>?????????????? ??????????????????????????</span>,
                    key: 'status-default',
                },
                {
                    label: <span style={{color: 'green'}}>??????????</span>,
                    key: 'status-started',
                },
            ],
        },
        {
            label: '??????????????????????',
            children: [
                {
                    type: 'group',
                    label: '???? ???????????????? ??????????????????????????',
                    children: [
                        {
                            label: '???? ??????????????????????',
                            key: 'sort-risk-asc',
                        },
                        {
                            label: '???? ????????????????',
                            key: 'sort-risk-desc',
                        },
                    ],
                },
                {
                    type: 'group',
                    label: '???? ???????????????????? ?????????????????????? ??????????????',
                    children: [
                        {
                            label: '???? ??????????????????????',
                            key: 'sort-money-asc',
                        },
                        {
                            label: '???? ????????????????',
                            key: 'sort-money-desc',
                        },
                    ],
                },
                {
                    type: 'group',
                    label: '???? ???????????????????? ????????????????????',
                    children: [
                        {
                            label: '???? ??????????????????????',
                            key: 'sort-inv-asc',
                        },
                        {
                            label: '???? ????????????????',
                            key: 'sort-inv-desc',
                        },
                    ],
                },
            ],
        },
    ];

    const onSelect = ({key}) => {
        let newFilters = filters

        if (key.includes('sort')) {
            newFilters = newFilters.filter((oldkey) => !oldkey.includes('sort'))
        }

        setCurrentFilters([...newFilters, key])
    };

    const onDeselect = ({key}) => {
        const newFilters = filters.filter(oldKey => oldKey !== key)
        setCurrentFilters(newFilters)
    };

    return <Space style={{padding: '20px', width: '100%'}} direction='vertical'>
        <Space style={{justifyContent: 'space-between', width: '100%'}}>
            <PageHeader
                style={{padding: 0}}
                className="site-page-header"
                title={<span className="profile-header">?????? ?????????????? ?? ????????????</span>}
            />
            <Space>
                <Link to='/deal/create'><Button type='primary'>?????????????? ???????????? ?????? ????????????</Button></Link>
                <Link to={`/`}><Button type='primary'>?????? ?????????????? ?? ????????????</Button></Link>
            </Space>
        </Space>
        <Tag style={{marginBottom: '10px'}} color='default'>?? ?????????????? ?????????????? ?????? ???????????? ???????? ?????????????? ??????????????????????????, ???????????????????????? ???????????????????? - <Rate disabled value={5} /></Tag>
        <Menu disabled={isLoading} multiple onSelect={onSelect} onDeselect={onDeselect} selectedKeys={filters} mode="horizontal" items={items} />
        <Input disabled={isLoading} value={search} onChange={(e) => setSearch(e.target.value)} size="large" placeholder="?????????? ???????????????? ?????? ????????????" prefix={<SearchOutlined />} />
        <Space>
            <Typography.Paragraph style={{marginBottom: 0}} strong>
                ???????? ????????????????????
                {' '}
                <DatePicker.RangePicker value={dateRange} onChange={setDateRange}/>
            </Typography.Paragraph>
            <Button disabled={isLoading} onClick={() => {
                setIsCheatLoading(true)
                setDateRange([undefined, undefined])
                setCurrentFilters([])
                setSearch('')
                setTimeout(() => {
                    updateDataRef.current()
                }, 300)
            }}>????????????????</Button>
            <Button disabled={isLoading} onClick={() => {
                updateData()
            }}>??????????????????</Button>
        </Space>
        {isLoading ? <Spin className="main-spinner" size="large" /> : <div className="dealsList">
            {filteredDeals?.map(deal => <SmallDealCard key={deal.ID} deal={deal} />)}
        </div>}
        {
            filteredDeals && !filteredDeals.length && !isLoading ? '?????????????? ?????? ???????????? ???? ??????????????' : null
        }
    </Space>;
}

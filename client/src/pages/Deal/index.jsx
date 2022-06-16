import { usePostUpdateUserMutation, useGetUserByIdQuery } from '../../queries/user'
import { Tag, Card, Progress, Rate, Timeline, Input, Button, Comment, Avatar, Tooltip, InputNumber, Image } from "antd";

import {useState} from 'react'
import { Space, PageHeader, Spin, Result, Typography } from "antd";
import './index.css'
import UserCard from '../../components/UserCard';
import { useParams, Link } from 'react-router-dom';
import { useGetDealByIdQuery, usePostUpdateDealMutation, usePostUpdateStageMutation } from '../../queries/deal';

const { Paragraph } = Typography

export const dealStatus = (deal) => {
    switch(true) {
        case deal.IsFinished:
            return ['завершена', 'green']
        case deal.IsFrozen:
            return ['заморожена', 'blue']
        case deal.IsStarted:
            return ['начата', 'green']
        case deal.IsApproved:
            return ['подтверждена', 'green']
        default:
            return ['ожидает подтверждения', 'gray']
    }
}

export const stageColor = (stage) => {
    switch(true) {
        case stage.IsFinished:
            return 'green'
        case stage.IsApproved:
            return 'blue'
        case stage.IsSubmited:
            return 'blue'
        case stage.IsStarted:
            return 'blue'
        default:
            return 'gray'
    }
}

export default function DealPage({user, users}) {
    const [unloadBalance, setUnloadBalance] = useState(0)
    const [profit, setProfit] = useState(0)
    const [comment, setComment] = useState('')
    const {id} = useParams()
    
    const {data: deal, isLoading: isDealLoading, isError: isDealError }= useGetDealByIdQuery({ID: id})
    
    const [updateDeal, {isLoading: tempLoading}] = usePostUpdateDealMutation()
    const [updateStage, {isLoading: isStageUpdating}] = usePostUpdateStageMutation()
    const [updateUser, {isLoading: isUpdating}] = usePostUpdateUserMutation()

    const isLoading = tempLoading || isStageUpdating || isUpdating
    
    if (isDealLoading) {
        return <Spin className="main-spinner" size="large" />
    }

    if (isDealError) {
        return <Result status="404" title="404" subTitle="Такой сделки не существует" />
    }

    const [status, colorStatus] = dealStatus(deal)
    
    const stageToApprove = deal.Stages.find(({IsSubmited}) => IsSubmited)
    const stageToApproveIndex = deal.Stages.findIndex(({IsSubmited}) => IsSubmited)
    const lastStarted = deal.Stages.find(({IsStarted}) => IsStarted)
    const lastStageToStart = deal.Stages.find(({IsStarted}) => !IsStarted)
    const lastStageToStartIndex = deal.Stages.findIndex(({IsStarted}) => !IsStarted)
    const lastStageToFinish = deal.Stages.find(({IsStarted, IsFinished}) => IsStarted && !IsFinished)
    const lastStageToFinishIndex = deal.Stages.findIndex(({IsStarted, IsFinished}) => IsStarted && !IsFinished)
    const brandNew = !deal.IsStarted && !deal.IsApproved && !deal.IsFrozen && !deal.IsFinished
    const isUser = user.Role === 0
    const isModerator = user.Role === 1
    const isAdmin = user.Role === 2
    const isDifferentUser = user.ID !== deal.UserID
    const moneyToRaise = deal.Stages.reduce((acc, {MoneyGoal}) => acc + MoneyGoal, 0)
    const currentBalance = deal.Investments.reduce((acc, {Amount}) => acc + Amount, 0)
    const invParts = deal.Investments.reduce((acc, {Amount, UserID}) => {
        acc[UserID] = acc[UserID] ? Amount + acc[UserID]: Amount
        return acc
    }, {})
    Object.keys(invParts).forEach(UserID => {
        invParts[UserID] = invParts[UserID] / moneyToRaise
    })
    const rate = deal.Rates.length ? deal.Rates.reduce((acc, {Rate}) => acc + Rate, 0) / deal.Rates.length : 0
    const completion = deal.Stages.reduce((acc, {IsFinished}) => acc + Number(IsFinished), 0) / deal.Stages.length * 100
    const allStagesCompleted = !deal.Stages.filter(({IsFinished}) => !IsFinished).length
    const investorsIds = [...new Set(deal.Investments.map(({UserID}) => UserID))]
    const investors = investorsIds.length
    const finalDate = deal.Stages[deal.Stages.length - 1].FinishDate

    const usersBalance = users.reduce((acc, {Balance, ID}) => {
        acc[ID] = Balance
        return acc
    }, {})
    
    return <Space style={{padding: '20px', width: '100%'}} direction='vertical'>
        <Space align='center' style={{justifyContent: 'space-between', width: '100%'}}>
            <PageHeader
                style={{padding: 0}}
                className="site-page-header"
                title={<span className="user-header">{deal.Title}</span>}
            />
        </Space>
        <Card className="smallDealCard" size="default">
            <Space align='start'>
        <Space style={{marginBottom: '10px'}} direction='vertical'>
            <Space style={{marginBottom: '10px'}} direction='vertical'>
                <Tag style={{marginBottom: '10px'}} color={colorStatus}>{status}</Tag>
                <Rate disabled value={rate} />
                <Paragraph>{deal.Description}</Paragraph>

                <Paragraph>Примерная дата окончания: {finalDate}</Paragraph>
                <Paragraph>Количество инвесторов: {investors}</Paragraph>
                <Progress status="active" percent={Math.floor(currentBalance/moneyToRaise * 100)} />
                <Paragraph style={{color: currentBalance/moneyToRaise > 0.5 ? 'green' : 'gray'}}>Собрано {currentBalance}/{moneyToRaise} руб.</Paragraph>
                <Paragraph >Прогресс по выполнению этапов <Progress style={{marginRight: '10px'}} type="circle" percent={Math.floor(completion)} width={40} /></Paragraph>
                <Timeline>
                    {deal.Stages.map(stage => {
                        return <Timeline.Item key={stage.ID} color={stageColor(stage)}>{stage.Title}</Timeline.Item>
                    })}
                </Timeline>
            </Space>
            
            <Space style={{marginBottom: '10px'}} direction='vertical'>
                {
                    deal.IsApproved && !deal.IsFinished && !allStagesCompleted && !deal.IsFrozen ? 
                    <>
                        <InputNumber min={100} max={Math.min(user.Balance, moneyToRaise - currentBalance)} disabled={isLoading} value={unloadBalance} onChange={(e) => setUnloadBalance(e)} size="large" placeholder="Инвестировать" />
                        <Button onClick={() => {
                            updateUser({ID: user.ID, Balance: user.Balance - unloadBalance })
                            updateDeal({ID: deal.ID, Investments: [
                                ...deal.Investments,
                                {
                                    DealID: deal.ID,
                                    UserID: user.ID,
                                    Amount: unloadBalance
                                }
                            ]
                            })
                            setUnloadBalance(0)
                        }} loading={isLoading} disabled={isLoading}>
                            Инвестировать
                        </Button>
                    </>
                : null
                }

                {
                    brandNew && (isModerator || isAdmin) ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateDeal({ID: deal.ID, IsApproved: true })
                    }} loading={isLoading} disabled={isLoading}>
                        Подтвердить проект или сделку
                    </Button>: null
                }
                {
                    !deal.IsFrozen && !deal.IsFinished && (isModerator || isAdmin) ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateDeal({ID: deal.ID, IsFrozen: true })
                    }} loading={isLoading} disabled={isLoading}>
                        Заморозить проект или сделку
                    </Button>: null
                }
                {
                    deal.IsFrozen && (isModerator || isAdmin) ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateDeal({ID: deal.ID, IsFrozen: false })
                    }} loading={isLoading} disabled={isLoading}>
                        Разморозить проект или сделку
                    </Button>: null
                }
                {
                    !deal.IsFrozen && !deal.IsFinished && (isModerator || isAdmin) && !(completion === 100 && !deal.IsFinished && !deal.IsFrozen && !isDifferentUser) ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateDeal({ID: deal.ID, IsFinished: true })
                        investorsIds.forEach(UserID => {
                            updateUser({ID: UserID, Balance: usersBalance[UserID] + invParts[UserID] * currentBalance})
                        })
                    }} loading={isLoading || isUpdating} disabled={isLoading || isUpdating}>
                        Завершить
                    </Button>: null
                }
                {
                    deal.IsStarted && !deal.IsFrozen && !deal.IsFinished && stageToApprove && (isModerator || isAdmin) ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateStage({
                            ID: stageToApprove.ID,
                            IsSubmited: false,
                            IsFinished: true
                        })
                    }} loading={isLoading} disabled={isLoading || isStageUpdating}>
                        Подтвердить выполнение этапа
                    </Button>: null
                }
                {
                    !lastStageToFinish && !stageToApprove && deal.IsStarted && !deal.IsFrozen && !deal.IsFinished && !allStagesCompleted && !isDifferentUser ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateStage({
                            ID: lastStageToStart.ID,
                            IsSubmited: false,
                            IsStarted: true
                        })
                        updateUser({
                            ID: user.ID,
                            balance: user.Balance + lastStageToStart.MoneyGoal
                        })
                    }} loading={isLoading} disabled={isLoading || isStageUpdating}>
                        Начать выполнение этапа
                    </Button>: null
                }
                {
                    lastStageToFinish && deal.IsStarted && !deal.IsFrozen && !deal.IsFinished && !isDifferentUser ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateStage({
                            ID: lastStageToFinish.ID,
                            IsSubmited: true,
                            IsStarted: false
                        })
                    }} loading={isLoading} disabled={isLoading || isStageUpdating}>
                        Завершить выполнение этапа
                    </Button>: null
                }
                {
                    moneyToRaise <= currentBalance && deal.IsApproved && !deal.IsFrozen && !deal.IsFinished && !deal.IsStarted && !isDifferentUser ? <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                        updateDeal({ID: deal.ID, IsStarted: true })
                    }} loading={isLoading} disabled={isLoading}>
                        Начать проект или сделку
                    </Button>: null
                }
                {
                    completion === 100 && !deal.IsFinished && !deal.IsFrozen && !isDifferentUser ? <>
                        <InputNumber style={{marginTop: '30px'}} min={0} disabled={isLoading} value={profit} onChange={(e) => setProfit(e)} size="large" placeholder="Прибыль" />
                        <Button type='danger' style={{marginBottom: '30px'}} onClick={() => {
                            updateDeal({ID: deal.ID, IsFinished: true })
                            investorsIds.forEach(UserID => {
                                updateUser({ID: UserID, Balance: usersBalance[UserID] + invParts[UserID] * profit})
                            })
                        }} loading={isLoading || isUpdating} disabled={isLoading || isUpdating}>
                            Завершить проект или сделку
                        </Button>
                    </>: null
                }
            </Space>

            <Space style={{marginBottom: '10px'}} direction='vertical'>
                <Paragraph style={{marginTop: '40px'}}>Комментарии</Paragraph>
                <Input.TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий" max={500} />
                <Button onClick={() => {
                    updateDeal({ID: deal.ID, Comments: [...deal.Comments, {
                        DealID: deal.ID,
                        UserID: user.ID,
                        Text: comment
                    }] })
                    setComment('')
                }} loading={isLoading} disabled={isLoading}>
                    Добавить коммент
                </Button>
                {deal.Comments.map(comment => {
                    return    <Comment
                            author={<Link to={`/user/${comment.UserID}`}></Link>}
                            avatar={<Avatar />}
                            content={comment.Text}
                            datetime={
                                <Tooltip title={new Date(comment.CreatedAt).toLocaleString()}>
                                <span>{new Date(comment.CreatedAt).toLocaleString()}</span>
                                </Tooltip>
                            }
                        />
                })
                }
            </Space>
            </Space>
            <Space>
                        {deal.Images.map(image => (
                            <Image
                                key={image}
                                width={200}
                                src={image}
                            />
                        ))}
                    </Space>
            </Space>
        </Card>
    </Space>
}

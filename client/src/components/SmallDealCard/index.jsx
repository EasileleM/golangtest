import { Tag, Typography, Card, Progress, Rate } from "antd";
import { Link } from "react-router-dom";

import './index.css'

const { Paragraph } = Typography;

export const dealStatus = (deal) => {
    switch(true) {
        case deal.IsFinished:
            return ['завершена', 'green']
        case deal.IsFrozen:
            return ['заморожена', 'blue']
        case deal.IsApproved:
            return ['подтверждена', 'green']
        case deal.IsStarted:
            return ['начата', 'green']
        default:
            return ['ожидает подтверждения', 'gray']
    }
}

export default function SmallDealCard({deal}) {
    const [status, colorStatus] = dealStatus(deal)

    const moneyToRaise = deal.Stages.reduce((acc, {MoneyGoal}) => acc + MoneyGoal, 0)
    const currentBalance = deal.Investments.reduce((acc, {Amount}) => acc + Amount, 0)
    const rate = deal.Rates.length ? deal.Rates.reduce((acc, {Rate}) => acc + Rate, 0) / deal.Rates.length : 0
    const completion = deal.Stages.reduce((acc, {IsFinished}) => acc + Number(IsFinished), 0) / deal.Stages.length * 100
    const investors = [...new Set(deal.Investments.map(({UserID}) => UserID))].length
    const finalDate = deal.Stages[deal.Stages.length - 1].FinishDate
    
    return  <Card className="smallDealCard" size="small" title={<span className="smallUserCardTitle">{deal.Title}</span>} extra={<><Progress style={{marginRight: '10px'}} type="circle" percent={Math.floor(completion)} width={40} /><Link to={`/deal/${deal.ID}`}>Перейти</Link></>}>
        <Tag style={{marginBottom: '10px'}} color={colorStatus}>{status}</Tag>
        <Rate disabled value={rate} />
        <Paragraph>{deal.Description}</Paragraph>
        <Paragraph>Примерная дата окончания: {finalDate}</Paragraph>
        <Paragraph>Количество инвесторов: {investors}</Paragraph>
        <Progress status="active" percent={Math.floor(currentBalance/moneyToRaise * 100)} />
        <Paragraph style={{color: currentBalance/moneyToRaise > 0.5 ? 'green' : 'gray'}}>Собрано {currentBalance}/{moneyToRaise} руб.</Paragraph>
     </Card>
}

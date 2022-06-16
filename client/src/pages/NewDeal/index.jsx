import { Formik } from 'formik';
import * as Yup from 'yup';
import { useCallback, useEffect, useState } from 'react'
import {
    useNavigate
} from "react-router-dom";
 
import './index.css'
import { Button, Input, Form, Space, Tag } from "antd";
import FieldFormikContext from "../../components/FieldFormContext";

import {
    PlusOutlined
} from '@ant-design/icons';
import UploadImage from "../../components/UploadImage";
import { usePostCreateDealMutation } from '../../queries/deal';


const allowedDate = new Date()
const finishDateRegExp = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
const StageSchema = Yup.object().shape({
    Title: Yup.string()
        .min(2, 'Название очень короткое')
        .max(250, 'Название очень длинное')
        .required('Название обязательно'),
    Description: Yup.string()
        .min(2, 'Описание очень короткое')
        .max(22250, 'Описание очень длинное')
        .required('Описание обязательно'),
    MoneyGoal: Yup.number()
        .required('Цель обязательна'),
    FinishDate: Yup.string()
        .matches(finishDateRegExp, 'Не корректная дата - формат YYYY-MM-DD')
        .test('min', 
            'Время в будущем', 
            function(date) { 
                return new Date(date) > allowedDate; 
            }
         )
        .required('Дата обязательна'),
});

const DealSchema = Yup.object().shape({
    Title: Yup.string()
        .min(2, 'Название очень короткое')
        .max(250, 'Название очень длинное')
        .required('Название обязательно'),
    Description: Yup.string()
        .min(2, 'Описание очень короткое')
        .max(22250, 'Описание очень длинное')
        .required('Описание обязательно'),
    Stages: Yup.object().shape({
        0: StageSchema.default(undefined),
        1: StageSchema.default(undefined),
        2: StageSchema.default(undefined),
        3: StageSchema.default(undefined),
        4: StageSchema.default(undefined),
        5: StageSchema.default(undefined),
        6: StageSchema.default(undefined),
        7: StageSchema.default(undefined),
        8: StageSchema.default(undefined)
    })
});



export default function NewDealPage({user}) {
    const navigate = useNavigate()
    const [createDeal] = usePostCreateDealMutation()
    const [fileList, setFileList] = useState([])
    const [stagesAmount, setStagesAmount] = useState(0)

    const handleCreate = useCallback(async (data, { setFieldError }) => {
        const Stages = Object.entries(data.Stages).filter(([_, stage]) => stage).reduce((acc, [key, stage]) => {
            acc[key] = {
                ...stage,
                MoneyGoal: Number(stage.MoneyGoal)
            }
            return acc
        }, [])

        const money = Object
            .entries(data.Stages)
            .filter(([_, stage]) => stage)
            .reduce((acc, [_, { MoneyGoal }]) => {
                return acc + Number(MoneyGoal)
            }, 0)

        if (Stages.length < 1) {
            setFieldError('general', 'Нужно указать хотя бы один этап')
            return
        }

        if (money < 1000) {
            setFieldError('general', 'Сумма сборов должна превышать или быть равной 1000 руб.')
            return
        }

        const getBase64 = (file) =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

        const Images = await Promise.all(fileList.map(({originFileObj}) => getBase64(originFileObj)))

        const result = await createDeal({
            ...data,
            Images,
            Stages,
            UserID: user.ID
        })

        if (result.error) {
            setFieldError('general', 'Что-то пошло не так')
            return
        }

        navigate('/')
    }, [createDeal, fileList, navigate, user.ID])

    useEffect(() => {
        if (!user.IsPromoted) {
            navigate('/')
        }
    }, [navigate, user.IsPromoted])
    
    const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

    return <Space className="register-wrapper" direction="vertical">
        <h2>Создать проект или сделку</h2>
        <Formik
            initialValues={DealSchema.cast()} 
            validationSchema={DealSchema}
            onSubmit={handleCreate}
        >
            {({ handleSubmit, isSubmitting, isValid, dirty, errors, values, setFieldValue }) => (
                <Form
                    className="register-form"
                    onFinish={handleSubmit}
                    layout='vertical'
                >
                    <Tag className="tag-olo" color="green">
                        Детально опишите свой проект или сделку, чтобы заинтересовать инвесторов
                    </Tag>

                    <Tag className="tag-olo" color="blue">
                        Обязательно опишите хотя бы один этап
                    </Tag>

                    <Tag className="tag-olo" color='green'>
                        Максимально 8 картинок
                    </Tag>

                    <FieldFormikContext
                        id="Title"
                        name="Title"
                        label='Название'
                        placeholder='Название проекта или сделки'
                        renderComponent={Input}
                        maxLength={50}
                    />
                    <FieldFormikContext
                        id="Description"
                        name="Description"
                        label='Описание'
                        placeholder='Опишите идею проекта или сделки'
                        renderComponent={Input.TextArea}
                        maxLength={22250}
                    />

                    {
                        new Array(stagesAmount).fill(1).map((_, index) => (
                            <Space key={index} direction='vertical'>
                                <p>Этап {index + 1}</p>

                                <FieldFormikContext
                                    id={index}
                                    name={index}
                                    nest="Stages"
                                    field="Title"
                                    label='Название этапа'
                                    placeholder='Название этапа'
                                    renderComponent={Input}
                                    maxLength={50}
                                />
                                <FieldFormikContext
                                    id={index}
                                    name={index}
                                    nest="Stages"
                                    field="Description"
                                    label='Описание этапа'
                                    placeholder='Описание этапа'
                                    renderComponent={Input.TextArea}
                                    maxLength={22250}
                                />

                                <FieldFormikContext
                                    id={index}
                                    name={index}
                                    nest="Stages"
                                    field="MoneyGoal"
                                    label='Необходимое количество средств (в руб.)'
                                    placeholder='Необходимое количество средств'
                                    renderComponent={Input}
                                    maxLength={50}
                                />

                                <FieldFormikContext
                                    id={index}
                                    name={index}
                                    nest="Stages"
                                    field="FinishDate"
                                    label='Дата окончания'
                                    placeholder='YYYY-MM-DD'
                                    renderComponent={Input}
                                    maxLength={50}
                                />
                            </ Space>
                        ))
                    }
                    {stagesAmount ? 
                        <Button onClick={() => {
                            setStagesAmount(stagesAmount - 1)
                            setFieldValue(`Stages.${stagesAmount - 1}]`, undefined)
                            setFieldValue(`Stages.${stagesAmount - 1}]`, undefined)
                            setFieldValue(`Stages.${stagesAmount - 1}]`, undefined)
                        }} type='primary' style={{marginBottom: '10px'}}>
                            Удалить предыдущий этап
                            <PlusOutlined />
                        </Button>
                    : null}
                    
                    <Button onClick={() => {
                        setStagesAmount(stagesAmount + 1)
                    }} type='primary'>
                        Добавить этап
                        <PlusOutlined />
                    </Button>


                    <UploadImage fileList={fileList} handleChange={handleChange} />

                    {errors.general ? <p style={{ color: 'red' }}>{errors.general}</p> : null}
                    <Button
                        type='primary'
                        htmlType='submit'
                        loading={isSubmitting}
                        disabled={!dirty || (dirty && !isValid)}
                    >
                        Отправить на модерацию
                    </Button>
                </Form>
            )}
        </Formik>
    </Space>
}

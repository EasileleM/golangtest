import {
    Link,
    useParams,
    useNavigate
} from "react-router-dom";
import { usePostUpdateUserMutation, useGetUserByIdQuery } from '../../queries/user'
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useCallback } from 'react'
 
import { Button, Input, Form, Space, Spin } from "antd";
import FieldFormikContext from "../../components/FieldFormContext";

const phoneRegExp = /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/

const passportRegExp = /^[0-9]{4}:[0-9]{6}$/

const allowedBirthDate = new Date()
allowedBirthDate.setFullYear(allowedBirthDate.getFullYear() - 18)
const birthDateRegExp = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/

const EditSchema = Yup.object().shape({
    FirstName: Yup.string()
        .min(2, 'Имя очень короткое')
        .max(50, 'Имя очень длинное')
        .required('Имя обязательно'),
    LastName: Yup.string()
        .min(2, 'Фамилия очень короткая')
        .max(50, 'Фамилия очень длинная')
        .required('Фамилия обязательна'),
    Patronymic: Yup.string()
        .min(2, 'Отчество очень короткое')
        .max(50, 'Отчество очень длинное')
        .required('Отчество обязательно'),
    Email: Yup.string()
        .email('Некорректная почта')
        .required('Почта обязательна'),
    Birthday: Yup.string()
        .matches(birthDateRegExp, 'Не корректная дата - формат YYYY-MM-DD')
        .test('minAge', 
            'Минимальный допустимый возраст - 18 лет', 
            function(date) { 
                return new Date(date) < allowedBirthDate; 
            }
         )
        .required('Дата обязательна'),
    Phone: Yup.string().matches(phoneRegExp, 'Не корректный номер телефона').required('Телефон обязателен'),
    Passport: Yup.string().matches(passportRegExp, 'Номер и серия паспорта должны быть в формате - серия:номер').required('Паспорт обязателен')
});

export default function EditUserPage({user: currentUser}) {
    const {id} = useParams()
    const navigate = useNavigate()

    const canSee = currentUser.ID === Number(id) || currentUser.Role === 2
    
    const {data: user, isLoading: isUserLoading }= useGetUserByIdQuery({ID: id}, {
        skip: !canSee
    })
    
    const [updateUser] = usePostUpdateUserMutation()
    
    const handleEdit = useCallback(async (data, { setFieldError }) => {
        const result = await updateUser(data)
        
        if (result.error) {
            setFieldError('general', 'Что-то пошло не так')
            return
        }

        navigate(-1)
    }, [navigate, updateUser])
    
    if (!canSee) {
        return <div style={{padding: '10px', color: 'red'}}>У вас нет доступа к этой странице</div>
    }

    if (isUserLoading) {
        return <Spin className="main-spinner" size="large" />
    }

    return <Space className="register-wrapper" direction="vertical">
        <h2>Редактировать профиль</h2>
        <Formik
            initialValues={user}
            validationSchema={EditSchema}
            onSubmit={handleEdit}
        >
            {({ handleSubmit, isSubmitting, isValid, dirty, errors }) => (
                <Form
                    className="register-form"
                    onFinish={handleSubmit}
                    layout='vertical'
                >
                    <FieldFormikContext
                        id="FirstName"
                        name="FirstName"
                        label='Имя'
                        placeholder='Введите имя'
                        renderComponent={Input}
                        maxLength={50}
                    />
                    <FieldFormikContext
                        id="LastName"
                        name="LastName"
                        label='Фамилия'
                        placeholder='Введите фамилию'
                        renderComponent={Input}
                        maxLength={50}
                    />
                    <FieldFormikContext
                        id="Patronymic"
                        name="Patronymic"
                        label='Отчество'
                        placeholder='Введите отчество'
                        renderComponent={Input}
                        maxLength={50}
                    />
                    <FieldFormikContext
                        id="Email"
                        name="Email"
                        label='Почта'
                        placeholder='Введите почту'
                        renderComponent={Input}
                    />
                    <FieldFormikContext
                        id="Phone"
                        name="Phone"
                        label='Телефон'
                        placeholder='Введите телефон'
                        renderComponent={Input}
                    />
                    <FieldFormikContext
                        id="Birthday"
                        name="Birthday"
                        label='Дата рождения'
                        placeholder='2000-12-14'
                        renderComponent={Input}
                    />
                    <FieldFormikContext
                        id="Passport"
                        name="Passport"
                        label='Серия и номер паспорта'
                        placeholder='Введите серию и номер паспорта - 0000:000000'
                        renderComponent={Input}
                    />

                    {errors.general ? <p style={{ color: 'red' }}>{errors.general}</p> : null}
                    <Space>
                        <Button type='danger' onClick={() => navigate(-1)}>Отмена</Button>
                        <Button
                            type='primary'
                            htmlType='submit'
                            loading={isSubmitting}
                            disabled={!(dirty && isValid)}
                        >
                            Изменить
                        </Button>
                    </Space>
                </Form>
            )}
        </Formik>
    </Space>
}

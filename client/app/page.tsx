'use client'
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useNavigate} from 'react-router-dom'
import { AppContext } from '@/context/AppContext'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
const Login = () => {


  const [state, setState] = useState('Sign Up')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [gender, setGender] = useState('M')
  const router = useRouter()
  const {token, setToken, backendUrl} = useContext(AppContext)

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault()

    try {
      
      if (state === 'Sign Up'){
        const {data} = await axios.post(backendUrl + '/api/patient/register', {name, email, password, phone, date, gender})
        if (data.success) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('patientId', data.patientId); 
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      } else {
        const {data} = await axios.post(backendUrl + '/api/patient/login', { email, password})
        if (data.success) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('patientId', data.patientId); 
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      console.log(error)
      toast.error((error as Error).message)
    }
  }

  useEffect(() => {
    if (token) {
      console.log(token)
      router.push('/dashboard')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} action="" className='min-h-[50vh] flex items-center p-5 mt-20 '>
      <div className="flex flex-col gap-3 items-start text-sm mx-auto text-gray-500 border border-gray-500 rounded-sm sm:p-10 p-5">
        <p className='text-2xl font-bold text-blue-400'>{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'login'} to book an appointment</p>
        {
          state === 'Sign Up' && <div className="">
            <p>Full Name</p>
            <input className='rounded-sm py-1 px-3 w-70 border border-gray-500 ' type="text" onChange={(e) => setName(e.target.value)} value={name} required />
          </div>
        }
        <div className="">
          <p>Email</p>
          <input className='rounded-sm py-1 px-3 w-70 border border-gray-500 ' type="email" onChange={(e) => setEmail(e.target.value)} value={email} required />
        </div>
        <div className="">
          <p>Password</p>
          <input className='rounded-sm py-1 px-3 w-70 border border-gray-500 ' type="password" onChange={(e) => setPassword(e.target.value)} value={password} required />
        </div>

        {state === 'Sign Up' && <>
          <div>
            <p>Phone Number</p>
            <input type="tel" className='rounded-sm py-1 px-3 w-70 border border-gray-500 ' onChange={(e) => setPhone(e.target.value)} value={phone} required />
          </div>

          <div className="flex gap-2">
            <div className="">
              <p>Gender</p>
              <select className='rounded-sm py-1 px-3 w-34 border border-gray-500 ' onChange={(e) => setGender(e.target.value)} value={gender} required >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="">
              <p>Date Of Birth</p>
              <input type="date" className='rounded-sm py-1 px-3 w-34 border border-gray-500 ' onChange={(e) => setDate(e.target.value)} value={date} required />
            </div>
          </div>


        </>}
        <button type='submit' className='mt-5 text-left hover:scale-108 transition-all duration-500 bg-blue-400 text-sm text-white rounded-full py-3 px-8 cursor-pointer '>{state === 'Sign Up' ? "Create Account" : "Login"}</button>

        {
          state === 'Sign Up'
            ? <p>Already have an account? <span onClick={() => setState('Login')} className='text-blue-400 font-semibold cursor-pointer'>Login here</span></p>
            : <p>Don't have an account? <span onClick={() => setState('Sign Up')} className='text-blue-400 font-semibold cursor-pointer'>Create account</span></p>
        }
      </div>
    </form>
  )
}

export default Login
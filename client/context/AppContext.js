'use client'
import axios from "axios";
import { redirect } from "next/navigation";
import { createContext, useEffect } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
export const AppContext = createContext()

const AppContextProvider = (props) => {

    const backendUrl = 'http://localhost:4000'
    const [token, setToken] = useState('');
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (savedToken) setToken(savedToken);
    }, []);

    const signOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('patientId');
        setToken('');
        redirect('/');
      };

    const getUserDetails = async () => {
        if (!token) return; // 🚀 Prevent empty call

        try {
            const response = await axios.get(
                `${backendUrl}/api/patient/get-user-details`,
                {
                    headers: { token }
                }
            );

            if (response.data.success) {
                setUserDetails(response.data.user);
            } else {
                toast.error(response.data.message);
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        if (token) {
            getUserDetails();
        }
    }, [token]);

    const value = {
        token, setToken,
        backendUrl,
        userDetails, getUserDetails, signOut
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
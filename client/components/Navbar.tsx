import { AppContext } from '@/context/AppContext';
import Link from 'next/link';
import React, { useContext } from 'react'
import { PiDnaFill } from "react-icons/pi";
import { RxExit } from "react-icons/rx";

const Navbar = () => {
  const { signOut } = useContext(AppContext)
  return (
    <>
      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
.dashboard-root { font-family: 'DM Sans', sans-serif; }
.card {
  background: linear-gradient(145deg, rgba(15,28,50,0.85) 0%, rgba(8,18,38,0.9) 100%);
  border: 1px solid rgba(96,165,250,0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.card-hover {
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  border-color: rgba(96,165,250,0.3);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(96,165,250,0.1);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.5s ease forwards; }
.fade-up-1 { animation-delay: 0.05s; opacity: 0; }
.fade-up-2 { animation-delay: 0.12s; opacity: 0; }
.fade-up-3 { animation-delay: 0.20s; opacity: 0; }
.fade-up-4 { animation-delay: 0.28s; opacity: 0; }

      `}</style>
      <div className="flex justify-between items-center card rounded-2xl px-8 py-7 fade-up fade-up-1 h-20">
        <Link href='/' className=' mb-5 flex justify-start items-center gap-2 '
        >
          <span className="text-white bg-black text-4xl rounded-xl w-12 h-12 flex justify-center items-center" style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.2) 100%)",
            border: "1px solid rgba(96,165,250,0.35)",
          }}><PiDnaFill /></span><span className='text-3xl text-white '>HELIX</span>
        </Link>
        <div className="flex gap-4 items-center">
          
          <RxExit onClick={signOut} className='text-white text-2xl cursor-pointer' />
        </div>
      </div>
    </>
  )
}

export default Navbar
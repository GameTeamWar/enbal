'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Login() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
   phone: '',
   password: ''
 });

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);

   try {
     // Firebase'de telefon numarasını email formatına çevirerek kullanacağız
     const email = `${formData.phone}@enbalsigorta.com`;
     await signInWithEmailAndPassword(auth, email, formData.password);
     
     toast.success('Giriş başarılı!');
     router.push('/profile');
   } catch (error) {
     toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
   } finally {
     setLoading(false);
   }
 };

 return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
     <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
       <div className="text-center mb-8">
         <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
           </svg>
         </div>
         <h2 className="text-3xl font-bold text-gray-800">Giriş Yap</h2>
       </div>

       <form onSubmit={handleSubmit}>
         <div className="mb-4">
           <label className="block text-gray-700 mb-2">Telefon Numarası</label>
           <input
             type="tel"
             value={formData.phone}
             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
             className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
             placeholder="05XX XXX XX XX"
             required
           />
         </div>

         <div className="mb-6">
           <label className="block text-gray-700 mb-2">Şifre</label>
           <input
             type="password"
             value={formData.password}
             onChange={(e) => setFormData({ ...formData, password: e.target.value })}
             className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
             placeholder="••••••••"
             required
           />
         </div>

         <button
           type="submit"
           disabled={loading}
           className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
         >
           {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
         </button>
       </form>

       <div className="mt-6 text-center">
         <Link href="/forgot-password" className="text-purple-600 hover:text-purple-700 text-sm">
           Şifremi Unuttum
         </Link>
         <span className="text-gray-400 mx-2">|</span>
         <Link href="/register" className="text-purple-600 hover:text-purple-700 text-sm">
           Kayıt Ol
         </Link>
       </div>

       <div className="mt-4 text-center">
         <Link href="/" className="text-gray-600 hover:text-gray-700 text-sm">
           ← Ana Sayfaya Dön
         </Link>
       </div>
     </div>
   </div>
 );
}
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDPG_lEw8a7WTi_bIt6VpTQsj2pJgqhSw0',
  authDomain: 'bootcamp-future-maker-3a054.firebaseapp.com',
  projectId: 'bootcamp-future-maker-3a054',
  storageBucket: 'bootcamp-future-maker-3a054.firebasestorage.app',
  messagingSenderId: '29788769543',
  appId: '1:29788769543:web:586b1dc845c22fca79c9a2',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

async function main() {
  const testEmail = 'pemilik.dapurnia@gmail.com';
  const testPassword = 'Password123!';
  const testName = 'Firsa Adinda (Pemilik)';

  console.log(`Mencoba mendaftarkan akun uji: ${testEmail}...`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    await updateProfile(cred.user, { displayName: testName });
    console.log('BERHASIL! Akun uji terdaftar di Firebase Auth:');
    console.log('UID:', cred.user.uid);
    console.log('Email:', cred.user.email);
    console.log('DisplayName:', cred.user.displayName);
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      console.log('Akun sudah terdaftar sebelumnya di Firebase Auth.');
    } else {
      console.error('Error saat mendaftarkan akun:', err);
    }
  }
}

main();

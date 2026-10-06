import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
  const staffEmail = 'staf.dapurnia@gmail.com';
  const staffPassword = 'Password123!';
  const staffName = 'Rani (Staf Dapur)';

  console.log(`Mendaftarkan akun staf di Firebase Auth: ${staffEmail}...`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, staffEmail, staffPassword);
    await updateProfile(cred.user, { displayName: staffName });
    console.log('[SUKSES] Akun Staf Dapur berhasil didaftarkan di Firebase Auth:');
    console.log('UID:', cred.user.uid);
    console.log('Email:', cred.user.email);
    console.log('DisplayName:', cred.user.displayName);
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      console.log('[INFO] Akun staf sudah terdaftar sebelumnya di Firebase Auth.');
    } else {
      console.error('Error saat mendaftar:', err);
    }
  }
}

main();

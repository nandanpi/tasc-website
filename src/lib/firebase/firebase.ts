// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { writable, type Readable, derived } from 'svelte/store';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyDfA0NuQYGMacEZvf2ym1rzAmqZU3GRXJw',
	authDomain: 'login-62370.firebaseapp.com',
	projectId: 'login-62370',
	storageBucket: 'login-62370.appspot.com',
	messagingSenderId: '954495946912',
	appId: '1:954495946912:web:ce0eab04499e86a75039c5',
	measurementId: 'G-X47HSPHZ51'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

/* ************************************************************************** */

/**
 * @returns a store with the current firebase user
 */
function userStore() {
	let unsubscribe: () => void;

	if (!auth || !globalThis.window) {
		console.warn('Not in browser or Firebase Auth function is not initialized');
		const { subscribe } = writable<User | null>(null);
		return {
			subscribe
		};
	}

	const { subscribe } = writable(auth?.currentUser ?? null, (set) => {
		unsubscribe = onAuthStateChanged(auth, (user) => {
			set(user);
		});

		return () => unsubscribe();
	});

	return {
		subscribe
	};
}

export const user = userStore();

/* ************************************************************************** */

/**
 * @param  {string} path document path or reference
 * @param  {any} startWith optional default data
 * @returns a store with realtime updates on document data
 */
export function docStore<T>(path: string) {
	let unsubscribe: () => void;

	const docRef = doc(db, path);

	const { subscribe } = writable<T | null>(null, (set) => {
		unsubscribe = onSnapshot(docRef, (snapshot) => {
			set((snapshot.data() as T) ?? null);
		});

		return () => unsubscribe();
	});

	return {
		subscribe,
		ref: docRef,
		id: docRef.id
	};
}

/* ************************************************************************** */

interface AuthData {
	user: string;
}

const userID: Readable<AuthData | null> = derived(user, ($user, set) => {
	if ($user) {
		// console.log('userID updated, now tracking auth/', $user.uid);
		return docStore<AuthData>(`auth/${$user.uid}`).subscribe(set);
	} else {
		set(null);
	}
});

interface UserData {
	username: string;
	name: string;
	usn: string;
}

export const userData: Readable<UserData | null> = derived(userID, ($userID, set) => {
	if ($userID) {
		// console.log('userData updated, now tracking user/', $userID.user);
		return docStore<UserData>(`user/${$userID.user}`).subscribe(set);
	} else {
		set(null);
	}
});

/* ************************************************************************** */
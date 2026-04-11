// js/firebase-db.js
// Centralises Firebase initialisation so that auth.js and catalogue.js
// share the same app instance (initializeApp must only be called once).

import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

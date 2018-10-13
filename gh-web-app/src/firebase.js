import firebase from 'firebase'
// Initialize Firebase
const config = {
  apiKey: "AIzaSyBdvYFOsPRcYutg9Q2n2MI9cy1QyMpQUvo",
  authDomain: "globalhack-2018.firebaseapp.com",
  databaseURL: "https://globalhack-2018.firebaseio.com",
  projectId: "globalhack-2018",
  storageBucket: "globalhack-2018.appspot.com",
  messagingSenderId: "387429945640" };

  firebase.initializeApp(config);
  export default firebase;

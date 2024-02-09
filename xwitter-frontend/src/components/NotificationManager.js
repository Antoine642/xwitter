import { useState } from "react";

import { urlB64ToUint8Array } from "../utils";
const publicPushKey = 'BOfw9J3SFmHtIm_eyL7W4jSZsEeFEn1hLQnTYHKoXqrDdvcOed3v9QGQQjk35n0D-XOLv0WFLv8wvt4EUMe0fIQ';

function NotificationManager(props) {
  const [subscribed, setSubscribe] = useState(
    Notification.permission === 'granted'
  );

  async function subscribe() {
    const result = await Notification.requestPermission();
    
    if (result === 'granted'){
      const serviceWorker = await navigator.serviceWorker.ready;

      let subscribtion = await serviceWorker.pushManager.getSubscription();
      if(subscribtion === null){
        const subscribtionOptions = {
          userVisibleOnly: true,
          //obligation d'appeler cette fonction pour convertir la clé publique en Uint8Array
          applicationServerKey: urlB64ToUint8Array(publicPushKey),
        }
        subscribtion = await serviceWorker.pushManager.subscribe(subscribtionOptions);
      }
      // Enregistrement de l'abonnement sur le serveur BACKEND
      const response = await fetch('http://localhost:5000/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscribtion),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok){
        new Notification('Succès', { body: 'Vous êtes maintenant abonné aux notifications' });
      }else{
        alert('Echec de l\'abonnement');
      }
    }

  }
  async function testNotification() {
    const options = {
      body: 'Ceci est une notification de test',
      icon: '/logo192.png'
    };
    new Notification('Test notification', options);
  }

  if(subscribed){
    return (
      <div className="p-3 fixed-bottom end-0">
        <button className="btn btn-info" onClick={testNotification}>Tester les notifications</button>
      </div>
    )
  }
  return (
    <div className="p-3 fixed-bottom end-0">
      <button className="btn btn-info" onClick={subscribe}>S'abonner aux notifications</button>
    </div>
  )
}

export default NotificationManager;
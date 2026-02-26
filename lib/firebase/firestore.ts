import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { UserItem, UserLocation, UserProfile } from '@/lib/types';

export async function upsertUserProfile(uid: string, profile: UserProfile) {
  const ref = doc(firestore, 'users', uid);
  await setDoc(ref, { profile }, { merge: true });
}

export async function addUserLocation(uid: string, location: Omit<UserLocation, 'id'>) {
  const ref = collection(firestore, 'users', uid, 'locations');
  await addDoc(ref, location);
}

export async function bindItemToUser(uid: string, item: UserItem) {
  const userItemRef = doc(firestore, 'users', uid, 'items', item.qrId);
  const qrRef = doc(firestore, 'qr_codes', item.qrId);

  const qrDoc = await getDoc(qrRef);
  if (qrDoc.exists() && qrDoc.data().status === 'bound') {
    throw new Error('QR code already bound');
  }

  await setDoc(userItemRef, item, { merge: true });
  if (qrDoc.exists()) {
    await updateDoc(qrRef, { owner_uid: uid, status: 'bound' });
  } else {
    await setDoc(qrRef, { owner_uid: uid, item_details: item, status: 'bound' });
  }
}

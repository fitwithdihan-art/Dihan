import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { AppData, FriendProfile, FriendRequestItem, UserPreferences } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { getActiveBestRank } from './rankService';

// Preset community athletes for discovery & guest mode
export const INITIAL_COMMUNITY_ATHLETES: FriendProfile[] = [
  {
    id: 'ath_marcus_barbeast',
    username: 'barbeast_marcus',
    athleteName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80',
    level: 14,
    totalWorkouts: 84,
    streak: 6,
    favoriteExercise: 'Muscle-Up',
    bestPr: '25 Strict Pull-Ups',
    bestRank: 'Diamond Master of Bars',
    bestRankTier: 'diamond',
    bio: 'Strict bar athlete. 25 strict pull-ups and counting. Consistency over hype.',
    lastActive: '12m ago',
    status: 'online',
    isLocalDemo: true,
  },
  {
    id: 'ath_maya_rings',
    username: 'maya_cali',
    athleteName: 'Maya Lin',
    avatarUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&auto=format&fit=crop&q=80',
    level: 11,
    totalWorkouts: 62,
    streak: 4,
    favoriteExercise: 'Handstand Push-Up',
    bestPr: '60s Freestanding Hold',
    bestRank: 'Cosmic Obsidian Legend',
    bestRankTier: 'cosmic_obsidian',
    bio: 'Ring calisthenics specialist & handstand fanatic. Form first, always.',
    lastActive: '1h ago',
    status: 'training',
    isLocalDemo: true,
  },
  {
    id: 'ath_tyler_planche',
    username: 'tyler_planche',
    athleteName: 'Tyler Brooks',
    avatarUrl: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=150&auto=format&fit=crop&q=80',
    level: 18,
    totalWorkouts: 142,
    streak: 12,
    favoriteExercise: 'Full Planche',
    bestPr: '12s Full Planche',
    bestRank: 'Red Diamond Champion',
    bestRankTier: 'red_diamond',
    bio: 'Planche & lever chaser. Hard work beats genetics every single day.',
    lastActive: '3h ago',
    status: 'offline',
    isLocalDemo: true,
  },
  {
    id: 'ath_elena_pull',
    username: 'elena_bars',
    athleteName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    level: 9,
    totalWorkouts: 45,
    streak: 3,
    favoriteExercise: 'Front Lever',
    bestPr: '15s Straddle Front Lever',
    bestRank: 'Platinum Calisthenics Elite',
    bestRankTier: 'platinum',
    bio: 'Weighted pull-ups and front levers. Training 5 days a week.',
    lastActive: 'Just now',
    status: 'online',
    isLocalDemo: true,
  },
];

/**
 * Publishes the current athlete's profile to public_profiles collection
 * so friends can discover and see their current stats.
 */
export async function syncPublicProfile(
  user: User,
  preferences: UserPreferences,
  appData: AppData
): Promise<void> {
  const path = `public_profiles/${user.uid}`;
  try {
    // Calculate total workouts and level
    const totalWorkouts = appData.sessions ? appData.sessions.length : 0;
    const level = Math.max(1, Math.floor(totalWorkouts / 3) + 1);

    // Calculate current streak
    let streak = 0;
    if (appData.sessions && appData.sessions.length > 0) {
      const sorted = [...appData.sessions].sort((a, b) => b.startTime - a.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastSessionDate = new Date(sorted[0].startTime);
      lastSessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round((today.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak = Math.min(sorted.length, Math.max(1, diffDays === 0 ? 1 : 2));
      }
    }

    // Determine best rank to showcase
    const activeRank = getActiveBestRank(appData);

    const publicProfile = {
      userId: user.uid,
      username: preferences.username || user.displayName?.toLowerCase().replace(/\s+/g, '_') || `athlete_${user.uid.slice(0, 5)}`,
      athleteName: preferences.athleteName || user.displayName || 'Calisthenics Athlete',
      avatarUrl: preferences.avatarUrl || user.photoURL || '',
      bio: preferences.bio || 'Calisthenics athlete training for mastery.',
      bestRank: preferences.bestRank || activeRank.title,
      bestRankTier: preferences.bestRankTier || activeRank.tier,
      level,
      totalWorkouts,
      streak,
      favoriteExercise: appData.prs && appData.prs.length > 0 ? appData.prs[0].exerciseName : 'Pull-Up',
      updatedAt: Date.now(),
    };

    const docRef = doc(db, 'public_profiles', user.uid);
    await setDoc(docRef, publicProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Searches public profiles by username or athlete name.
 */
export async function searchAthletesInFirestore(queryStr: string): Promise<FriendProfile[]> {
  const path = 'public_profiles';
  const clean = queryStr.trim().toLowerCase();
  if (!clean) return [];

  try {
    const collRef = collection(db, path);
    // Fetch recent athletes (limit 25)
    const q = query(collRef, limit(25));
    const snap = await getDocs(q);

    const matches: FriendProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const uName = (data.username || '').toLowerCase();
      const aName = (data.athleteName || '').toLowerCase();

      if (uName.includes(clean) || aName.includes(clean)) {
        matches.push({
          id: docSnap.id,
          userId: data.userId || docSnap.id,
          username: data.username,
          athleteName: data.athleteName,
          avatarUrl: data.avatarUrl,
          level: data.level || 1,
          totalWorkouts: data.totalWorkouts || 0,
          streak: data.streak || 0,
          favoriteExercise: data.favoriteExercise,
          bio: data.bio,
          bestRank: data.bestRank,
          bestRankTier: data.bestRankTier,
          status: 'online',
        });
      }
    });

    return matches;
  } catch (error) {
    console.warn('Firestore athlete search fallback to local matching:', error);
    return [];
  }
}

/**
 * Sends a friend request in Firestore.
 */
export async function sendFriendRequestInFirestore(
  fromUser: User,
  fromProfile: { username: string; athleteName: string; avatarUrl?: string },
  targetAthlete: FriendProfile
): Promise<void> {
  const path = 'friend_requests';
  try {
    const requestId = `${fromUser.uid}_${targetAthlete.userId || targetAthlete.id}`;
    const reqDocRef = doc(db, path, requestId);

    const payload: Omit<FriendRequestItem, 'id'> = {
      fromUserId: fromUser.uid,
      fromUsername: fromProfile.username,
      fromAthleteName: fromProfile.athleteName,
      fromAvatarUrl: fromProfile.avatarUrl || '',
      toUserId: targetAthlete.userId || targetAthlete.id,
      toUsername: targetAthlete.username,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(reqDocRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Subscribes to incoming friend requests for the current user.
 */
export function subscribeToIncomingFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequestItem[]) => void
): () => void {
  const path = 'friend_requests';
  const q = query(
    collection(db, path),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const requests: FriendRequestItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requests.push({
          id: docSnap.id,
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          fromAthleteName: data.fromAthleteName,
          fromAvatarUrl: data.fromAvatarUrl,
          toUserId: data.toUserId,
          toUsername: data.toUsername,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      onUpdate(requests);
    },
    (error) => {
      console.error('Failed to listen to friend requests:', error);
    }
  );

  return unsubscribe;
}

/**
 * Accepts or declines a friend request.
 */
export async function respondToFriendRequestInFirestore(
  requestId: string,
  newStatus: 'accepted' | 'declined'
): Promise<void> {
  const path = `friend_requests/${requestId}`;
  try {
    const docRef = doc(db, 'friend_requests', requestId);
    if (newStatus === 'declined') {
      await deleteDoc(docRef);
    } else {
      await setDoc(
        docRef,
        {
          status: 'accepted',
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export interface AudioUploadResult {
  url: string;
  name: string;
  size: number;
}

export async function readFileAsBase64(file: File | Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  // Node.js or environments without FileReader
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || 'audio/mpeg';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

// 400KB characters per base64 chunk (~300KB raw binary), well under Firestore's 1MB doc limit
const CHUNK_SIZE = 400000;

/**
 * Uploads an MP3 or audio file directly into Cloud Firestore without needing Firebase Storage.
 * Stores metadata in 'audio_files/{audioId}' and chunks in 'audio_files/{audioId}/chunks/{index}'.
 */
export async function uploadAudioFile(
  file: File,
  siteSlug: string,
  onProgress?: (progress: number) => void
): Promise<AudioUploadResult> {
  const safeBaseName = file.name.replace(/[^\w.-]/g, '_');
  const audioId = `${Date.now()}_${safeBaseName}`;

  try {
    if (onProgress) onProgress(10);
    const dataUrl = await readFileAsBase64(file);
    if (onProgress) onProgress(30);

    // Extract raw base64 string
    const commaIdx = dataUrl.indexOf(',');
    const base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const mimeType = file.type || 'audio/mpeg';

    const totalChunks = Math.max(1, Math.ceil(base64Data.length / CHUNK_SIZE));

    // 1. Save file metadata
    await setDoc(doc(db, 'audio_files', audioId), {
      id: audioId,
      name: file.name,
      size: file.size,
      type: mimeType,
      totalChunks,
      siteSlug: siteSlug || 'general',
      createdAt: new Date().toISOString()
    });

    if (onProgress) onProgress(45);

    // 2. Upload chunks to Firestore subcollection
    const uploadStepProgress = 50 / totalChunks;
    for (let i = 0; i < totalChunks; i++) {
      const chunkStr = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(db, 'audio_files', audioId, 'chunks', String(i)), {
        index: i,
        data: chunkStr
      });
      if (onProgress) {
        onProgress(Math.min(98, Math.round(45 + (i + 1) * uploadStepProgress)));
      }
    }

    if (onProgress) onProgress(100);

    return {
      url: `firestore-audio:${audioId}`,
      name: file.name,
      size: file.size
    };
  } catch (firestoreErr) {
    console.error('Firestore audio upload failed:', firestoreErr);
    throw new Error('Firestore ထဲသို့ သီချင်းဖိုင် သိမ်းဆည်း၍ မရနိုင်ပါ: ' + (firestoreErr instanceof Error ? firestoreErr.message : String(firestoreErr)));
  }
}

// In-memory cache for resolved Object URLs to prevent redundant Firestore reads and re-fetches
const audioBlobCache = new Map<string, string>();

/**
 * Resolves an audio URL into a playable URL.
 * If the URL is in 'firestore-audio:{audioId}' format, it downloads the chunks from Firestore,
 * merges them, constructs a binary Blob Object URL, and caches it.
 * If already a normal URL or data URL, it returns it directly.
 */
export async function resolveAudioUrl(audioUrl?: string): Promise<string> {
  if (!audioUrl) return '';

  // If not stored in Firestore, return as-is
  if (!audioUrl.startsWith('firestore-audio:')) {
    return audioUrl;
  }

  // Check in-memory cache
  if (audioBlobCache.has(audioUrl)) {
    return audioBlobCache.get(audioUrl)!;
  }

  const audioId = audioUrl.replace('firestore-audio:', '').trim();
  if (!audioId) return '';

  try {
    const metaDoc = await getDoc(doc(db, 'audio_files', audioId));
    if (!metaDoc.exists()) {
      console.warn('Audio metadata not found in Firestore:', audioId);
      return '';
    }

    const metadata = metaDoc.data();
    const mimeType = metadata.type || 'audio/mpeg';

    // Fetch chunks
    const chunksSnap = await getDocs(collection(db, 'audio_files', audioId, 'chunks'));
    if (chunksSnap.empty) {
      console.warn('Audio chunks not found for:', audioId);
      return '';
    }

    const chunkDocs = chunksSnap.docs.map(d => d.data() as { index: number; data: string });
    chunkDocs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const fullBase64 = chunkDocs.map(c => c.data).join('');
    if (!fullBase64) return '';

    // Convert base64 to binary Uint8Array
    const binaryStr = atob(fullBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blob = new Blob([bytes], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      audioBlobCache.set(audioUrl, objectUrl);
      return objectUrl;
    }

    const dataUrl = `data:${mimeType};base64,${fullBase64}`;
    audioBlobCache.set(audioUrl, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Error resolving Firestore audio:', err);
    return '';
  }
}

/**
 * Cleans up an audio file from Firestore when removed.
 */
export async function deleteAudioFromFirestore(audioUrl?: string): Promise<void> {
  if (!audioUrl || !audioUrl.startsWith('firestore-audio:')) return;
  const audioId = audioUrl.replace('firestore-audio:', '').trim();
  if (!audioId) return;

  try {
    const chunksSnap = await getDocs(collection(db, 'audio_files', audioId, 'chunks'));
    const batch = writeBatch(db);
    chunksSnap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    batch.delete(doc(db, 'audio_files', audioId));
    await batch.commit();

    if (audioBlobCache.has(audioUrl)) {
      URL.revokeObjectURL(audioBlobCache.get(audioUrl)!);
      audioBlobCache.delete(audioUrl);
    }
  } catch (err) {
    console.warn('Failed to delete audio from Firestore:', err);
  }
}


import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { useSeason } from '../context/SeasonContext';
import {
  getDiaryPhotos,
  addDiaryPhoto as addDiaryPhotoDB,
  getDiaryPhotoById,
  deleteDiaryPhoto as deleteDiaryPhotoDB,
  type DiaryPhoto,
  type DiaryPhotoInput,
} from '../database/diaryService';

interface UseDiaryPhotosReturn {
  photos: DiaryPhoto[];
  isLoading: boolean;
  addPhoto: (input: DiaryPhotoInput) => Promise<number>;
  deletePhoto: (id: number) => Promise<void>;
  refreshPhotos: () => Promise<void>;
}

export function useDiaryPhotos(): UseDiaryPhotosReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPhotos = useCallback(async () => {
    try {
      const data = await getDiaryPhotos(db, selectedSeason);
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching diary photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  const addPhoto = useCallback(
    async (input: DiaryPhotoInput) => {
      const id = await addDiaryPhotoDB(db, selectedSeason, input);
      await refreshPhotos();
      return id;
    },
    [db, selectedSeason, refreshPhotos]
  );

  const deletePhoto = useCallback(
    async (id: number) => {
      const row = await getDiaryPhotoById(db, id);
      await deleteDiaryPhotoDB(db, id);
      if (row?.image_uri) {
        try {
          const info = await FileSystem.getInfoAsync(row.image_uri);
          if (info.exists) await FileSystem.deleteAsync(row.image_uri, { idempotent: true });
        } catch {
          // File sudah hilang — abaikan, row DB sudah terhapus
        }
      }
      await refreshPhotos();
    },
    [db, refreshPhotos]
  );

  return { photos, isLoading, addPhoto, deletePhoto, refreshPhotos };
}

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export const StorageService = {
  async uploadImage(
    uri: string,
    path: string,
    fileName?: string,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      console.log('📤 Uploading image to:', path);

      const response = await fetch(uri);
      const blob = await response.blob();

      const name = fileName || `image_${Date.now()}.jpg`;
      const storageRef = ref(storage, `${path}/${name}`);

      const snapshot = await uploadBytes(
        storageRef,
        blob,
        contentType ? { contentType } : undefined
      );
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('✅ Image uploaded successfully:', downloadURL);

      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
      };
    } catch (error) {
      console.error('❌ Image upload failed:', error);
      throw new Error('Failed to upload image');
    }
  },

  async uploadVideo(
    uri: string,
    path: string,
    fileName?: string
  ): Promise<UploadResult> {
    try {
      console.log('📤 Uploading video to:', path);

      const response = await fetch(uri);
      const blob = await response.blob();

      const name = fileName || `video_${Date.now()}.mp4`;
      const storageRef = ref(storage, `${path}/${name}`);

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'video/mp4',
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('✅ Video uploaded successfully:', downloadURL);

      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
      };
    } catch (error) {
      console.error('❌ Video upload failed:', error);
      throw new Error('Failed to upload video');
    }
  },

  async uploadFile(
    uri: string,
    path: string,
    fileName: string,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      console.log('📤 Uploading file to:', path);

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `${path}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: contentType || blob.type,
      });
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('✅ File uploaded successfully:', downloadURL);

      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
      };
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error('Failed to upload file');
    }
  },

  async deleteFile(path: string): Promise<void> {
    try {
      console.log('🗑️ Deleting file:', path);

      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      console.log('✅ File deleted successfully');
    } catch (error) {
      console.error('❌ File deletion failed:', error);
      throw new Error('Failed to delete file');
    }
  },

  async listFiles(path: string): Promise<string[]> {
    try {
      console.log('📂 Listing files in:', path);

      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);

      const urls = await Promise.all(
        result.items.map(item => getDownloadURL(item))
      );

      console.log('✅ Found files:', urls.length);
      return urls;
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      throw new Error('Failed to list files');
    }
  },

  async pickAndUploadImage(
    path: string,
    options?: ImagePicker.ImagePickerOptions
  ): Promise<UploadResult | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const { uri, mimeType } = result.assets[0];
      return await StorageService.uploadImage(uri, path, undefined, mimeType || undefined);
    } catch (error) {
      console.error('❌ Pick and upload image failed:', error);
      throw new Error('Failed to pick and upload image');
    }
  },

  async pickAndUploadVideo(
    path: string,
    options?: ImagePicker.ImagePickerOptions
  ): Promise<UploadResult | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        ...options,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const { uri } = result.assets[0];
      return await StorageService.uploadVideo(uri, path);
    } catch (error) {
      console.error('❌ Pick and upload video failed:', error);
      throw new Error('Failed to pick and upload video');
    }
  },

  async takePhotoAndUpload(
    path: string,
    options?: ImagePicker.ImagePickerOptions
  ): Promise<UploadResult | null> {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...options,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const { uri, mimeType } = result.assets[0];
      return await StorageService.uploadImage(uri, path, undefined, mimeType || undefined);
    } catch (error) {
      console.error('❌ Take photo and upload failed:', error);
      throw new Error('Failed to take photo and upload');
    }
  },

  async uploadProofMedia(
    bookingId: string,
    providerId: string,
    media: { uri: string; type: 'image' | 'video' }[]
  ): Promise<any[]> {
    try {
      console.log('📤 Uploading proof media for booking:', bookingId);
      const uploadedMedia = [];

      for (const item of media) {
        const timestamp = Date.now();
        const fileName = `proof_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        const path = `proof/${bookingId}`;

        let result: UploadResult;
        if (item.type === 'image') {
          result = await this.uploadImage(item.uri, path, `${fileName}.jpg`);
        } else {
          result = await this.uploadVideo(item.uri, path, `${fileName}.mp4`);
        }

        uploadedMedia.push({
          id: `proof_${timestamp}`,
          type: item.type,
          uri: result.url,
          uploadedAt: new Date().toISOString(),
        });
      }

      console.log('✅ All proof media uploaded successfully');
      return uploadedMedia;
    } catch (error) {
      console.error('❌ Proof media upload failed:', error);
      throw new Error('Failed to upload proof media');
    }
  },

  getStoragePath: {
    userProfile: (userId: string) => `profiles/${userId}`,
    userAvatar: (userId: string) => `profiles/${userId}`,
    bookingAttachment: (bookingId: string) => `bookings/${bookingId}`,
    disputeEvidence: (disputeId: string) => `disputes/${disputeId}`,
    chatMedia: (conversationId: string) => `chats/${conversationId}`,
    serviceImage: (serviceId: string) => `services/${serviceId}`,
    vehicleImage: (userId: string) => `vehicles/${userId}`,
    kycDocument: (userId: string) => `kyc/${userId}`,
    proofMedia: (bookingId: string) => `proof/${bookingId}`,
  },
};

export default StorageService;

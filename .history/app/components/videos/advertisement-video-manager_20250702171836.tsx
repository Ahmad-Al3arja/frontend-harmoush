"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useAuthStore } from "@/app/lib/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.1.3:8000/api";

interface AdvertisementVideo {
  id: number;
  video_url: string;
  uploaded_at: string;
  is_active: boolean;
}

export default function AdvertisementVideoManager() {
  const [videos, setVideos] = useState<AdvertisementVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<AdvertisementVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVideos();
    fetchActiveVideo();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products/advertisement-video/all/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setVideos(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveVideo() {
    try {
      const res = await fetch(`${API_BASE}/products/advertisement-video/`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveVideo(data);
    } catch {
      setActiveVideo(null);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("video", selectedFile);
    try {
      const res = await fetch(`${API_BASE}/products/advertisement-video/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      setSelectedFile(null);
      fetchVideos();
      fetchActiveVideo();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Advertisement Video Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-6">
        <label className="block font-semibold mb-2">Upload New Advertisement Video</label>
        <input
          type="file"
          accept="video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="mb-2"
          disabled={uploading}
        />
        {selectedFile && (
          <div className="mb-2">
            <video
              src={URL.createObjectURL(selectedFile)}
              controls
              className="w-full max-h-64 rounded border"
            />
          </div>
        )}
        <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
      </div>
      <div className="mb-6">
        <label className="block font-semibold mb-2">Current Active Advertisement Video</label>
        {activeVideo ? (
          <video
            src={activeVideo.video_url}
            controls
            className="w-full max-h-64 rounded border"
          />
        ) : (
          <div className="text-gray-500">No active advertisement video.</div>
        )}
      </div>
      <div>
        <label className="block font-semibold mb-2">All Advertisement Videos</label>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`p-3 border rounded flex items-center gap-4 ${
                  video.is_active ? "bg-green-50 border-green-400" : ""
                }`}
              >
                <video
                  src={video.video_url}
                  controls
                  className="w-40 h-24 rounded border"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">
                    Uploaded: {new Date(video.uploaded_at).toLocaleString()}
                  </div>
                  {video.is_active && (
                    <span className="text-green-600 font-semibold text-xs">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
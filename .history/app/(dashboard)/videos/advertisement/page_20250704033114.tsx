'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingBar } from '@/components/ui/loading-bar'
import { toast } from 'sonner'
import { Upload, Play, Edit, Trash2, Eye, CheckCircle, XCircle, Plus } from 'lucide-react'
import { useAuthStore } from '@/app/lib/store'

interface AdvertisementVideo {
  id: number
  title: string
  video: string
  video_url: string
  thumbnail: string | null
  thumbnail_url: string | null
  uploaded_by: number
  uploaded_by_name: string
  uploaded_at: string
  updated_at: string
  is_active: boolean
}

// Helper to get CSRF token from cookies
function getCookie(name: string) {
  let cookieValue = null;
  if (typeof document !== 'undefined' && document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function AdvertisementVideosPage() {
  const [videos, setVideos] = useState<AdvertisementVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<AdvertisementVideo | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    video: null as File | null,
    thumbnail: null as File | null,
    is_active: false
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://188.245.103.205/api'
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/videos/`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      })
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      } else {
        toast.error('Failed to fetch videos')
      }
    } catch (error) {
      toast.error('Error fetching videos')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'video' | 'thumbnail') => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }))
    }
  }

  const handleUpload = async () => {
    if (!formData.title || !formData.video) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('video', formData.video)
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail)
      }
      formDataToSend.append('is_active', formData.is_active.toString())

      const response = await fetch(`${API_BASE}/videos/`, {
        method: 'POST',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        body: formDataToSend
      })

      if (response.ok) {
        toast.success('Video uploaded successfully')
        setIsUploadDialogOpen(false)
        setFormData({ title: '', video: null, thumbnail: null, is_active: false })
        fetchVideos()
      } else {
        const error = await response.json()
        toast.error(error.video?.[0] || 'Failed to upload video')
      }
    } catch (error) {
      toast.error('Error uploading video')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedVideo || !formData.title) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      if (formData.video) {
        formDataToSend.append('video', formData.video)
      }
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail)
      }
      formDataToSend.append('is_active', formData.is_active.toString())

      const response = await fetch(`${API_BASE}/videos/${selectedVideo.id}/`, {
        method: 'PUT',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        body: formDataToSend
      })

      if (response.ok) {
        toast.success('Video updated successfully')
        setIsEditDialogOpen(false)
        setSelectedVideo(null)
        setFormData({ title: '', video: null, thumbnail: null, is_active: false })
        fetchVideos()
      } else {
        const error = await response.json()
        toast.error(error.video?.[0] || 'Failed to update video')
      }
    } catch (error) {
      toast.error('Error updating video')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (videoId: number) => {
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}/`, {
        method: 'DELETE',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      })

      if (response.ok) {
        toast.success('Video deleted successfully')
        fetchVideos()
      } else {
        toast.error('Failed to delete video')
      }
    } catch (error) {
      toast.error('Error deleting video')
    }
  }

  const handleSetActive = async (videoId: number) => {
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}/set-active/`, {
        method: 'POST',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      })

      if (response.ok) {
        toast.success('Video activated successfully')
        fetchVideos()
      } else {
        toast.error('Failed to activate video')
      }
    } catch (error) {
      toast.error('Error activating video')
    }
  }

  const openEditDialog = (video: AdvertisementVideo) => {
    setSelectedVideo(video)
    setFormData({
      title: video.title,
      video: null,
      thumbnail: null,
      is_active: video.is_active
    })
    setIsEditDialogOpen(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingBar />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advertisement Videos</h1>
          <p className="text-muted-foreground">
            Manage advertisement videos that appear on the mobile app home page
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Advertisement Video</DialogTitle>
              <DialogDescription>
                Upload a new advertisement video. Only one video can be active at a time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Video File * (Max 250MB)</label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, 'video')}
                />
                {formData.video && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {formData.video.name} ({formatFileSize(formData.video.size)})
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Thumbnail Image (Optional, Max 5MB)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                />
                {formData.thumbnail && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {formData.thumbnail.name} ({formatFileSize(formData.thumbnail.size)})
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <label htmlFor="is_active" className="text-sm">Set as active video</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos uploaded</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first advertisement video to get started
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload First Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          videos.map((video) => (
            <Card key={video.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {video.title}
                      {video.is_active && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Uploaded by {video.uploaded_by_name || 'Admin'} on {formatDate(video.uploaded_at)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!video.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(video.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(video)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <ConfirmDialog
                      title="Delete Video"
                      description="Are you sure you want to delete this video? This action cannot be undone."
                      onConfirm={() => handleDelete(video.id)}
                    >
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Video</h4>
                    <div className="relative">
                      <video
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                        poster={video.thumbnail_url || undefined}
                      >
                        <source src={video.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => window.open(video.video_url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge variant={video.is_active ? "default" : "secondary"} className="ml-2">
                          {video.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {formatDate(video.uploaded_at)}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span> {formatDate(video.updated_at)}
                      </div>
                      {video.thumbnail_url && (
                        <div>
                          <span className="font-medium">Thumbnail:</span>
                          <img
                            src={video.thumbnail_url}
                            alt="Thumbnail"
                            className="w-16 h-16 object-cover rounded mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Advertisement Video</DialogTitle>
            <DialogDescription>
              Update the video details. Only one video can be active at a time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Replace Video (Optional, Max 250MB)</label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
              />
              {formData.video && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.video.name} ({formatFileSize(formData.video.size)})
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Replace Thumbnail (Optional, Max 5MB)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'thumbnail')}
              />
              {formData.thumbnail && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.thumbnail.name} ({formatFileSize(formData.thumbnail.size)})
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <label htmlFor="edit_is_active" className="text-sm">Set as active video</label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={uploading}>
                {uploading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
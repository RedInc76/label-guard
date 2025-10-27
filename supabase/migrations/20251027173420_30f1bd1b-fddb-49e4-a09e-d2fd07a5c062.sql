-- Make product-photos bucket public for permanent URLs
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-photos';

-- Clean up expired signed URLs from scan_history
UPDATE scan_history 
SET 
  front_photo_url = NULL,
  back_photo_url = NULL
WHERE (front_photo_url IS NOT NULL AND front_photo_url LIKE '%token=%')
   OR (back_photo_url IS NOT NULL AND back_photo_url LIKE '%token=%');
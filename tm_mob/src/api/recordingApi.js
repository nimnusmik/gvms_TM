import client from './client';

export async function getRecordingUploadUrl(callLogId, { filename, contentType, sizeBytes }) {
  const response = await client.post(`/calls/logs/${callLogId}/recording-upload/`, {
    filename,
    content_type: contentType,
    size_bytes: sizeBytes,
  });
  return response.data;
}

export async function uploadFileToS3(uploadUrl, fileUri, contentType) {
  console.log('[S3] uploadUrl:', uploadUrl);
  console.log('[S3] fileUri:', fileUri);
  console.log('[S3] contentType:', contentType);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 60000;
    xhr.onload = () => {
      console.log('[S3] xhr.status:', xhr.status, xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 PUT failed: ${xhr.status} ${xhr.responseText}`));
      }
    };
    xhr.onerror = (e) => {
      console.log('[S3] xhr.onerror fired, status:', xhr.status, 'readyState:', xhr.readyState);
      reject(new Error(`XHR network error`));
    };
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.send({ uri: fileUri, type: contentType, name: 'recording' });
  });
}

export async function confirmRecordingUpload(callLogId, key) {
  const response = await client.post(`/calls/logs/${callLogId}/recording-complete/`, { key });
  return response.data;
}

import React, { useState, useEffect } from 'react';
import DraggableMap from './DraggableMap';
import { useNavigate, useLocation } from 'react-router-dom';
import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from 'react-i18next';

const rejectionOptions = [
  'Spam or irrelevant submission',
  'Already resolved or addressed (Duplicate)',
  'Incorrect location',
  'Photo unclear or missing',
  'Audio not understandable',
  'Other',
];

export default function WorkDemandDialog({
  open,
  onClose,
  item,
  onAccepted,
  onRejected,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const MainStore = useMainStore((state) => state);

  const [showImages, setShowImages] = useState(false);
  const [showAudios, setShowAudios] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectReasonDialog, setShowRejectReasonDialog] = useState(false);
  const [updatedCoordinates, setUpdatedCoordinates] = useState({ lat: 0, lng: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper for downloading files - WebView compatible
  const handleDownload = async (url, filename) => {
    console.log('Download clicked for:', url, filename);
    
    // Show immediate feedback
    alert(`Opening file: ${filename || 'download'}\n\nPlease wait...`);
    
    try {
      // Force open in new tab for WebView environments
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show user instruction immediately
      setTimeout(() => {
        alert(`File opened in new tab!\n\nTo save the file:\n1. Long-press on the file\n2. Select "Save" or "Download"\n3. Choose your download location\n\nIf nothing opened, the URL is:\n${url}`);
      }, 1000);
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback - try to open URL directly
      try {
        window.open(url, '_blank');
        alert(`File opened in new tab!\n\nTo save the file:\n1. Long-press on the file\n2. Select "Save" or "Download"\n3. Choose your download location\n\nIf nothing opened, the URL is:\n${url}`);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        alert(`Cannot open file. Please copy this URL and open it manually:\n\n${url}`);
      }
    }
  };

  // Initialize coordinates when item changes
  useEffect(() => {
    if (item) {
      setUpdatedCoordinates({
        lat: Number(item.latitude) || 0,
        lng: Number(item.longitude) || 0
      });
    }
  }, [item]);

  if (!open || !item) return null;

  // Check if buttons should be enabled based on current state
  const isActionable = item.state === 'ACCEPTED_STAGE_1' || item.state === 'UNMODERATED';
  
  const handleAccept = async () => {
    if (!isActionable) return;
    
    console.log('🎯 WorkDemandDialog - handleAccept called:', { item, isActionable });
    
    setIsProcessing(true);
    console.log("🎯 WorkDemandDialog - handleAccept called:", { item, isActionable });

  // 👉 NEW: If item_type is Story, skip API and just update + close dialog

  console.log('item type ' +item.item_type)
  if (item.item_type === "Story") {
    console.log("📘 Story item detected — skipping API call.");

    // Direct local update
    const updatedItem = {
      ...item,
      ...(updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0 && {
        latitude: updatedCoordinates.lat,
        longitude: updatedCoordinates.lng
      })
    };

    MainStore.setAcceptedWorkDemandItem(updatedItem);
    MainStore.setAcceptedFromDialog();

    if (updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0) {
      MainStore.setAcceptedWorkDemandCoords([updatedCoordinates.lng, updatedCoordinates.lat]);
    }
      const requestBody = {
        item_id: item.id,
        state: 'ACCEPTED_STAGE_1',
      };
    
      const res = await fetch(`${import.meta.env.VITE_API_URL}upsert_item/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

    
    onClose?.();
    return; // EXIT EARLY
  }
    try {
      const requestBody = {
        item_id: item.id,
        state: 'ACCEPTED_STAGE_1',
      };

      // Only include coordinates if they are valid
      if (updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0) {
        requestBody.coordinates = {
          'lat': updatedCoordinates.lat,
          'lon': updatedCoordinates.lng
        };
      }

      console.log('🎯 WorkDemandDialog - API request body:', requestBody);

      const res = await fetch(`${import.meta.env.VITE_API_URL}upsert_item/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('🎯 WorkDemandDialog - API response status:', res.status);

      if (!res.ok) throw new Error('Failed to accept item');

      const updatedItem = {
        ...item,
        ...(updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0 && {
          latitude: updatedCoordinates.lat,
          longitude: updatedCoordinates.lng
        })
      };

      console.log('🎯 WorkDemandDialog - Updated item:', updatedItem);

      MainStore.setAcceptedWorkDemandItem(updatedItem);
      MainStore.setAcceptedFromDialog();
      
      // 🎯 NEW: Set the accepted work demand coordinates for marker display
      if (updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0) {
        MainStore.setAcceptedWorkDemandCoords([updatedCoordinates.lng, updatedCoordinates.lat]);
        console.log('🎯 WorkDemandDialog - Set accepted work demand coordinates:', [updatedCoordinates.lng, updatedCoordinates.lat]);
      } else {
        console.log('⚠️ WorkDemandDialog - No valid coordinates available for accepted item');
      }
      

      console.log('�� WorkDemandDialog - MainStore updated, navigating to /maps');

      const currentQuery = location.search || '';
      navigate(`/maps${currentQuery}`, { replace: true });

      console.log('🎯 WorkDemandDialog - Navigation called, calling callbacks');

      onAccepted?.();
      onClose?.();

      console.log('🎯 WorkDemandDialog - handleAccept completed successfully');
    } catch (err) {
      console.error('❌ WorkDemandDialog - Accept error:', err);
    } finally {
      setIsProcessing(false);
      console.log('🎯 WorkDemandDialog - Processing finished');
    }
  };

  const handleReject = async () => {
    if (!isActionable) return;
    
    setIsProcessing(true);
    try {
      if (!rejectionReason) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}upsert_item/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          state: 'REJECTED_STAGE_1',
          misc: { rejection_reason: rejectionReason },
        }),
      });

      if (!res.ok) throw new Error('Failed to reject item');

      onRejected?.();
      setRejectionReason('');
      setShowRejectReasonDialog(false);
      onClose();
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePositionChange = (newPos) => {
    setUpdatedCoordinates({
      lat: newPos.lat,
      lng: newPos.lng
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
          >
            ✕
          </button>

          <h3 className="text-lg font-semibold mb-4">
            {t("Stage 1: Review & Respond")}
          </h3>







          <div className="space-y-6">
            {updatedCoordinates.lat !== 0 && updatedCoordinates.lng !== 0 ? (
              <DraggableMap
                lat={updatedCoordinates.lat}
                lng={updatedCoordinates.lng}
                onPositionChange={handlePositionChange}
              />
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">No coordinates available for this item</p>
                <p className="text-sm text-gray-400">The map cannot be displayed without valid coordinates</p>
              </div>
            )}



            {/* Images */}
            <div>
              <button
                onClick={() => setShowImages((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">{t("Photos")}</span>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full border">
                    {(item.images || []).length || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`transform transition-transform duration-200 ${showImages ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {showImages && (
                <div className="mt-4 overflow-x-auto whitespace-nowrap">
                  {(item.images || []).length > 0 ? (
                    item.images.map((img, i) => (
                      <div key={i} className="inline-block mr-4 text-center">
                        <img
                          src={img}
                          alt={`img-${i}`}
                          className="h-32 w-auto rounded shadow-md cursor-pointer hover:opacity-80 transition"
                          onClick={() => setActivePreviewImage(img)}
                        />
                                                 <button
                           onClick={() => handleDownload(img, `image-${i + 1}.jpg`)}
                           className="mt-2 text-sm text-blue-600 hover:underline"
                         >
                           {t("Download")}
                         </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 mt-2">No images available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Audio */}
            <div>
              <button
                onClick={() => setShowAudios((prev) => !prev)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">{t("Recordings")}</span>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full border">
                    {(item.audios || []).length || 0}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`transform transition-transform duration-200 ${showAudios ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {showAudios && (
                <div className="mt-4 space-y-4">
                  {(item.audios || []).length > 0 ? (
                    item.audios.map((url, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <audio controls className="flex-1">
                          <source src={url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <button
                          onClick={() => handleDownload(url, `audio-${i + 1}.mp3`)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t("Download")}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 mt-2">No audio files available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Accept / Reject */}
            <div className="mt-6 pt-4">
              <div className="flex flex-row gap-4 justify-center items-center mb-4">
                <button
                  onClick={handleAccept}
                  disabled={!isActionable || isProcessing}
                  className={`px-6 py-3 rounded-lg w-full sm:w-auto transition-all duration-200 transform hover:scale-105 font-semibold ${
                    isActionable && !isProcessing
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' : t("Accept")}
                </button>

                <button
                  onClick={() => isActionable && !isProcessing && setShowRejectReasonDialog(true)}
                  disabled={!isActionable || isProcessing}
                  className={`px-6 py-3 rounded-lg w-full sm:w-auto transition-all duration-200 transform hover:scale-105 font-semibold ${
                    isActionable && !isProcessing
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Processing...' : t("Reject")}
                </button>
              </div>
              

            </div>
          </div>
        </div>
      </div>

      {/* Preview Image Modal */}
      {activePreviewImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => setActivePreviewImage(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-red-400 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>
          
          {/* Image Container */}
          <div className="flex-1 flex flex-col items-center justify-center w-full h-full max-w-full max-h-full">
            <img
              src={activePreviewImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
            
            {/* Download Button */}
            <button
              onClick={() => handleDownload(activePreviewImage)}
              className="mt-4 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t("Download")}
            </button>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {showRejectReasonDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowRejectReasonDialog(false);
                setRejectionReason('');
              }}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-4">Select Rejection Reason</h3>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            >
              <option value="">Select reason</option>
              {rejectionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              onClick={handleReject}
              disabled={!rejectionReason || isProcessing}
              className={`w-full text-white px-4 py-2 rounded ${
                rejectionReason && !isProcessing ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

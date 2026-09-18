import React, { useState, useEffect, useMemo, useRef } from 'react';

export default function UploadPhotoModal({
  isOpen,
  onClose,
  initialAircraft = '',
  initialLivery = '',
  userProfile
}) {
  // Form State
  const [aircraftList, setAircraftList] = useState([]);
  const [allLiveries, setAllLiveries] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState(initialAircraft);
  const [selectedLivery, setSelectedLivery] = useState(initialLivery);
  const [credit, setCredit] = useState(userProfile?.discourseUsername || userProfile?.username || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success' | 'error', text: string }

  const fileInputRef = useRef(null);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialAircraft) setSelectedAircraft(initialAircraft);
      if (initialLivery) setSelectedLivery(initialLivery);
      if (userProfile?.discourseUsername || userProfile?.username) {
        setCredit(userProfile.discourseUsername || userProfile.username);
      }
      setUploadMsg(null);
    }
  }, [isOpen, initialAircraft, initialLivery, userProfile]);

  // Fetch Aircraft & Livery definitions
  useEffect(() => {
    let active = true;
    const loadLiveries = async () => {
      try {
        const res = await fetch('/api/aircraft/liveries');
        if (res.ok) {
          const data = await res.json();
          const items = data.result || [];
          if (active) {
            setAllLiveries(items);
            const uniqueAircraft = [...new Set(items.map(l => l.aircraftName))].sort();
            setAircraftList(uniqueAircraft);
          }
        }
      } catch (e) {
        console.error('Failed to load aircraft list:', e);
      }
    };
    loadLiveries();
    return () => { active = false; };
  }, []);

  // Compute available liveries for selected aircraft
  const availableLiveries = useMemo(() => {
    if (!selectedAircraft) return [];
    return allLiveries
      .filter(l => l.aircraftName === selectedAircraft)
      .map(l => l.liveryName)
      .sort();
  }, [allLiveries, selectedAircraft]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setUploadMsg({ type: 'error', text: 'File size exceeds 10MB limit.' });
        return;
      }
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setUploadMsg(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setUploadMsg({ type: 'error', text: 'File size exceeds 10MB limit.' });
        return;
      }
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setUploadMsg(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Submit Photo for Review
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAircraft || !selectedLivery || !file || !credit.trim()) {
      setUploadMsg({ type: 'error', text: 'Please fill out all fields and select a photo.' });
      return;
    }

    setIsUploading(true);
    setUploadMsg(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch('/upload-aircraft-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aircraft: selectedAircraft,
            livery: selectedLivery,
            credit: credit.trim(),
            image: ev.target.result
          })
        });

        const data = await res.json();
        if (data.success) {
          setUploadMsg({
            type: 'success',
            text: 'Photo uploaded successfully! It is now live on the radar.'
          });
          handleClearFile();
          window.dispatchEvent(new CustomEvent('track24:photo-uploaded', {
            detail: {
              aircraft: selectedAircraft,
              livery: selectedLivery,
              url: data.url,
              credit: credit.trim()
            }
          }));
        } else {
          setUploadMsg({ type: 'error', text: data.error || 'Upload failed. Please try again.' });
        }
      } catch (err) {
        setUploadMsg({ type: 'error', text: 'Network error submitting photo.' });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="wp-upload-modal wp-glass" onClick={e => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="wp-upload-header">
          <div className="wp-upload-title-wrap">
            <div className="wp-upload-title">
              <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#ffffff' }}></i>
              <span>Contribute Aircraft Photo</span>
            </div>
            <div className="wp-upload-subtitle">
              Submit genuine livery photos for admin review & live radar display
            </div>
          </div>
          <button className="wp-close-btn" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Upload Form */}
        <form className="wp-upload-body" onSubmit={handleSubmit}>
          {uploadMsg && (
            <div className={`wp-upload-alert ${uploadMsg.type}`}>
              <i className={`fa-solid ${uploadMsg.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
              <span>{uploadMsg.text}</span>
            </div>
          )}

          {/* Aircraft & Livery Pickers */}
          <div className="wp-upload-form-row">
            <div className="wp-upload-field">
              <label className="wp-upload-label">
                <i className="fa-solid fa-plane"></i> Aircraft Model
              </label>
              <select
                className="wp-upload-select"
                value={selectedAircraft}
                onChange={e => {
                  setSelectedAircraft(e.target.value);
                  setSelectedLivery('');
                }}
                required
              >
                <option value="">-- Select Aircraft Model --</option>
                {aircraftList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="wp-upload-field">
              <label className="wp-upload-label">
                <i className="fa-solid fa-brush"></i> Livery
              </label>
              <select
                className="wp-upload-select"
                value={selectedLivery}
                onChange={e => setSelectedLivery(e.target.value)}
                disabled={!selectedAircraft}
                required
              >
                <option value="">
                  {selectedAircraft ? '-- Select Livery --' : 'Select aircraft first'}
                </option>
                {availableLiveries.map(liv => (
                  <option key={liv} value={liv}>{liv}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo Dropzone */}
          <div className="wp-upload-field">
            <label className="wp-upload-label">
              <i className="fa-solid fa-image"></i> Aircraft Livery Photo
            </label>
            
            {!previewUrl ? (
              <div
                className="wp-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                <i className="fa-solid fa-cloud-arrow-up wp-dropzone-icon"></i>
                <div className="wp-dropzone-main">Click to select or drag & drop livery photo</div>
                <div className="wp-dropzone-hint">PNG, JPG, or WEBP · 3:2 landscape · Max 10MB</div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="wp-upload-preview-card">
                <img src={previewUrl} alt="Upload preview" className="wp-upload-preview-img" />
                <div className="wp-upload-preview-meta">
                  <div className="wp-preview-name">{file?.name}</div>
                  <div className="wp-preview-size">{file ? `${Math.round(file.size / 1024)} KB` : ''}</div>
                </div>
                <button
                  type="button"
                  className="wp-preview-remove-btn"
                  onClick={handleClearFile}
                  title="Remove image"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            )}
          </div>

          {/* Photographer Credit */}
          <div className="wp-upload-field">
            <label className="wp-upload-label">
              <i className="fa-solid fa-user-tag"></i> Your IF Username (Photo Credit)
            </label>
            <input
              type="text"
              className="wp-upload-input"
              placeholder="e.g. Sadiq_Ibraheem"
              value={credit}
              onChange={e => setCredit(e.target.value)}
              required
            />
            <span className="wp-upload-subhint">
              This will be displayed as the photographer credit on the live flight radar
            </span>
          </div>

          {/* Guidelines Checklist */}
          <div className="wp-upload-guidelines">
            <div className="wp-guidelines-title">
              <i className="fa-solid fa-clipboard-check"></i>
              <span>Photo Quality Guidelines</span>
            </div>
            <div className="wp-guidelines-grid">
              <div className="wp-guideline-item">
                <i className="fa-solid fa-check"></i>
                <span>Straight-on side profile view</span>
              </div>
              <div className="wp-guideline-item">
                <i className="fa-solid fa-check"></i>
                <span>Complete plane visible in frame</span>
              </div>
              <div className="wp-guideline-item">
                <i className="fa-solid fa-check"></i>
                <span>Daytime lighting · Clean livery</span>
              </div>
              <div className="wp-guideline-item">
                <i className="fa-solid fa-check"></i>
                <span>No HUD, nametags, or online dots</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="wp-upload-actions">
            <button
              type="button"
              className="wp-upload-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="wp-upload-submit-btn"
              disabled={isUploading || !selectedAircraft || !selectedLivery || !file || !credit.trim()}
            >
              {isUploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Submitting Photo…</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

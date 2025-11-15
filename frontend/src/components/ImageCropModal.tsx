import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FiX, FiCheck, FiRotateCw, FiZoomIn } from 'react-icons/fi';
import { Area } from 'react-easy-crop';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImage: string) => void;
}

const ImageCropModal = ({ isOpen, imageSrc, onClose, onCropComplete }: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onRotationChange = useCallback((rotation: number) => {
    setRotation(rotation);
  }, []);

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation: number = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set each dimension to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Draw rotated image
    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Paste generated rotate image at the top left corner
    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/jpeg');
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-neutral-200/50 animate-slide-in-up relative flex flex-col backdrop-blur-sm max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 border-b-2 border-neutral-700 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <FiZoomIn className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Edit Profile Picture</h2>
              <p className="text-xs text-neutral-300 mt-0.5">Crop, zoom, and adjust your image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-white hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 border border-white/30"
            aria-label="Close"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 relative bg-neutral-900" style={{ height: '400px', minHeight: '400px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 bg-gradient-to-r from-neutral-50 to-white border-t-2 border-neutral-200 px-6 py-5 space-y-4 rounded-b-3xl">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-700">
              <FiZoomIn size={16} />
              <span>Zoom</span>
              <span className="ml-auto text-neutral-500 font-normal">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-800"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-700">
              <FiRotateCw size={16} />
              <span>Rotation</span>
              <span className="ml-auto text-neutral-500 font-normal">{rotation}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <FiRotateCw size={18} />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-white rounded-xl font-bold hover:from-neutral-900 hover:via-neutral-950 hover:to-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <FiCheck size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;


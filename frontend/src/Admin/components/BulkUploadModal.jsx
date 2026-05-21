import React, { useState } from 'react';
import { X, Upload, Download, FileText, Image, CheckCircle2, AlertTriangle, RefreshCcw, ArrowRight, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { bulkUploadProducts } from '../../services/adminServices';
import { useNotification } from '../../context/NotificationContext';

export default function BulkUploadModal({ isOpen, onClose, seller, onComplete }) {
  const [csvFile, setCsvFile] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  if (!isOpen || !seller) return null;

  const handleDownloadSample = () => {
    const headers = ['Category','SubCategory','Tag','ProductName','DisplayName','Thickness','Width','Color','ProductType','ProductCode','Unit','MinPrice','MaxPrice','Stock','MOQ','DeliveryHours','Description','ImageName','AdditionalImages','Applications'];
    const demoRow = ['strach','FIlm','Packaging','Stretch film','strach_Metelized_stretch_film','"10,12,15"','1200','Transparent','Metelized','PB444','kg','100.00','250.00','1000','50','30','High quality stretch film.','stretch_film.jpg','"stretch_2.jpg,stretch_3.jpg"','"Packaging,Industrial"'];
    const csvContent = [headers.join(','), demoRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bulk_Template_${seller.company_name?.replace(/\s+/g,'_') || 'Seller'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!csvFile) return notifyError("Please select a CSV file first");
    setUploading(true);
    try {
      const res = await bulkUploadProducts(seller.user_id, csvFile, images);
      if (res.success) {
        setResults(res.summary);
        notifySuccess("Bulk upload completed!");
        if (onComplete) onComplete();
      }
    } catch (err) {
      notifyError("Bulk upload failed. Please check your CSV format.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCsvFile(null);
    setImages([]);
    setResults(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 to-black px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent/20 rounded-lg flex items-center justify-center">
              <Sparkles size={13} className="text-accent" />
            </div>
            <div>
              <p className="text-white text-sm font-black uppercase tracking-tight leading-tight">Bulk Upload</p>
              <p className="text-gray-400 text-[10px] font-medium">{seller.company_name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          {results ? (
            <div className="text-center py-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-green-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Upload Complete</h3>
              <p className="text-gray-400 text-xs font-medium mt-0.5 mb-4">Products added to catalog.</p>

              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-green-50 rounded-xl py-3">
                  <p className="text-2xl font-black text-green-600">{results.success}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-400">Added</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl py-3">
                  <p className="text-2xl font-black text-red-500">{results.errors}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-300">Failed</p>
                </div>
              </div>

              <button onClick={handleClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3">

              {/* Step 1 – Download */}
              <div className="flex items-center justify-between px-4 py-3 bg-accent/5 border border-accent/15 rounded-xl">
                <div className="flex items-center gap-3">
                  <Download size={15} className="text-accent shrink-0" />
                  <div>
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Step 1 — Download Template</p>
                    <p className="text-[10px] text-gray-400 font-medium">Get the pre-filled CSV format</p>
                  </div>
                </div>
                <button onClick={handleDownloadSample} className="flex items-center gap-1 text-accent text-[10px] font-black uppercase tracking-widest hover:gap-2 transition-all shrink-0">
                  Get <ArrowRight size={11} />
                </button>
              </div>

              {/* Step 2 – CSV */}
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <FileText size={10} /> Step 2 — CSV File *
                </p>
                <label className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all group
                  ${csvFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-accent/40 hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${csvFile ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-accent/10'}`}>
                    {csvFile ? <CheckCircle2 size={15} className="text-green-500" /> : <Upload size={15} className="text-gray-400 group-hover:text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${csvFile ? 'text-green-700' : 'text-gray-400'}`}>
                      {csvFile ? csvFile.name : 'Choose .csv file'}
                    </p>
                    {csvFile && <p className="text-[10px] text-green-500 font-medium">{(csvFile.size / 1024).toFixed(1)} KB</p>}
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
                </label>
              </div>

              {/* Step 3 – Images */}
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Image size={10} /> Step 3 — Images <span className="text-gray-300 font-medium normal-case">(optional)</span>
                </p>
                <label className={`flex items-center gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all group
                  ${images.length > 0 ? 'border-accent/40 bg-accent/5' : 'border-gray-200 hover:border-accent/40 hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${images.length > 0 ? 'bg-accent/10' : 'bg-gray-100 group-hover:bg-accent/10'}`}>
                    <Image size={15} className={images.length > 0 ? 'text-accent' : 'text-gray-400 group-hover:text-accent'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-black ${images.length > 0 ? 'text-accent' : 'text-gray-400'}`}>
                      {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'Select product images'}
                    </p>
                    <p className="text-[10px] text-gray-300 font-medium">Names must match ImageName column</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
                </label>
              </div>

              {/* Detailed Guide Toggle */}
              <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50/50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-blue-800">How to Upload (Read Guide)</span>
                  </div>
                  {showGuide ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />}
                </button>
                
                {showGuide && (
                  <div className="p-4 bg-white border-t border-blue-50 text-xs text-gray-700 leading-relaxed max-h-40 overflow-y-auto space-y-4 custom-scrollbar">
                    <div>
                      <strong className="text-gray-900 block text-sm mb-1">1. Required Fields:</strong>
                      <p>Category, SubCategory, and ProductName are mandatory. Other fields can be left blank if not applicable.</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 block text-sm mb-1">2. Single Image (ImageName):</strong>
                      <p>Put a direct web link (e.g. <code>https://link.com/img.jpg</code>) OR a filename (e.g. <code>box.jpg</code>). If using a filename, make sure to select that file in Step 3.</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 block text-sm mb-1">3. Multiple Images (AdditionalImages):</strong>
                      <p>Separate multiple links or filenames with a comma. <br/>
                      <span className="text-red-600 font-bold mt-1 inline-block">Important:</span> In Excel, wrap the entire text in double quotes.<br/>
                      <span className="mt-1 inline-block text-gray-500">Example with Files:</span> <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">"img1.jpg, img2.jpg"</code><br/>
                      <span className="mt-1 inline-block text-gray-500">Example with URLs:</span> <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 break-all">"https://link.com/1.jpg, https://link.com/2.jpg"</code></p>
                    </div>
                    <div>
                      <strong className="text-gray-900 block text-sm mb-1">4. Prices & Stock:</strong>
                      <p>Do not include currency symbols (₹) or text like 'kg' in numeric fields. Only use numbers (e.g. <code>150.00</code>).</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                disabled={uploading || !csvFile}
                onClick={handleUpload}
                className="w-full py-3.5 bg-gradient-to-r from-accent to-accent/80 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {uploading ? (
                  <><RefreshCcw size={15} className="animate-spin" /> Processing...</>
                ) : (
                  <><Upload size={15} /> Start Bulk Upload</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MapPin, Loader2, CheckCircle, ImagePlus } from "lucide-react";
import { NewSpotData, SpotCategory, CATEGORIES } from "../types";
import { compressAndUploadImage } from "../utils/helpers";
import { Loader } from "@googlemaps/js-api-loader";

interface SpotPostFormProps {
  onClose: () => void;
  onSubmit: (data: NewSpotData) => Promise<boolean>;
}

export default function SpotPostForm({ onClose, onSubmit }: SpotPostFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SpotCategory>("その他");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Google Maps Places ライブラリを読み込む
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
      language: process.env.NEXT_PUBLIC_MAPS_LANG || "ja",
      region: process.env.NEXT_PUBLIC_MAPS_REGION || "JP",
    });

    loader.load().then(() => {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    });
  }, []);

  // サジェスト外クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // マウント時に自動で現在地を取得
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("位置情報サービスが利用できません");
      return;
    }
    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setIsGettingLocation(false);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ja&key=${apiKey}`
            );
            const data = await res.json();
            if (data.results?.[0]) {
              setAddress(data.results[0].formatted_address);
            }
          } catch {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } else {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      (error) => {
        let errorMessage = "位置情報を取得できませんでした";
        switch (error.code) {
          case error.PERMISSION_DENIED: errorMessage = "位置情報の許可が必要です"; break;
          case error.POSITION_UNAVAILABLE: errorMessage = "位置情報が利用できません"; break;
          case error.TIMEOUT: errorMessage = "位置情報の取得がタイムアウトしました"; break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // 住所入力時にサジェストを取得（300msデバウンス）
  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    setSuggestions([]);
    setShowSuggestions(false);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!value.trim() || !autocompleteServiceRef.current) {
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current!.getPlacePredictions(
        { input: value, language: "ja" },
        (predictions, status) => {
          setIsLoadingSuggestions(false);
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            predictions.length > 0
          ) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          }
        }
      );
    }, 300);
  }, []);

  // 候補を選択したとき住所と座標を更新
  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setAddress(prediction.description);
    setSuggestions([]);
    setShowSuggestions(false);

    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { placeId: prediction.place_id },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const loc = results[0].geometry.location;
            setLatitude(loc.lat());
            setLongitude(loc.lng());
          }
        }
      );
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setSubmitError("タイトルを入力してください"); return; }
    if (latitude === null || longitude === null) { setSubmitError("位置情報を取得してください"); return; }

    setIsSubmitting(true);
    setSubmitError(null);

    let photoUrl: string | undefined;
    if (photoFile) {
      setIsUploadingPhoto(true);
      const url = await compressAndUploadImage(photoFile);
      setIsUploadingPhoto(false);
      if (url) photoUrl = url;
    }

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      address,
      latitude,
      longitude,
      photo_url: photoUrl,
    });

    setIsSubmitting(false);
    if (!success) setSubmitError("投稿に失敗しました。もう一度お試しください。");
  };

  const isButtonDisabled = isSubmitting || isGettingLocation || isUploadingPhoto || !title.trim() || latitude === null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 w-full max-w-lg border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-gray-300 bg-clip-text text-transparent">
              スポットを投稿
            </h2>
            <p className="text-gray-400 text-sm mt-1">お気に入りの場所を共有しましょう</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 位置情報取得中 */}
        {isGettingLocation && (
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-600/30 to-gray-500/30 rounded-full opacity-50 animate-pulse" />
              </div>
              <div>
                <div className="text-gray-200 font-medium">現在地を取得中...</div>
                <div className="text-gray-400 text-sm">GPSを使用して正確な位置を取得しています</div>
              </div>
            </div>
          </div>
        )}

        {/* 位置情報エラー */}
        {locationError && (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-900/40 to-red-800/40 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-red-300 font-medium">位置情報エラー</div>
                <div className="text-red-400 text-sm">{locationError}</div>
                <button
                  onClick={getCurrentLocation}
                  className="text-red-300 text-sm hover:text-red-200 mt-2 underline"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 位置情報取得済み */}
        {latitude !== null && !isGettingLocation && (
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center relative">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="text-gray-200 font-medium">位置情報を取得しました</div>
                <div className="text-gray-400 text-sm truncate max-w-[240px]">{address}</div>
              </div>
            </div>

            {/* 住所編集（オートコンプリート付き） */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/60 rounded-xl p-4">
              <label className="block text-xs text-gray-400 mb-2">住所を修正する場合は編集してください</label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="flex-1 bg-transparent text-gray-200 text-sm focus:outline-none"
                    placeholder="住所を入力してください"
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* サジェスト候補ドロップダウン */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-2 bg-gray-800 border border-gray-600/50 rounded-xl shadow-2xl z-10 overflow-hidden"
                  >
                    {suggestions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionSelect(prediction);
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-700/70 transition-colors border-b border-gray-700/50 last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {prediction.structured_formatting.main_text}
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            {prediction.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 位置情報なしで住所を直接入力する場合 */}
        {latitude === null && !isGettingLocation && (
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/30 rounded-2xl p-6 mb-6">
            <label className="block text-xs text-gray-400 mb-2">住所を入力してください</label>
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/60 rounded-xl p-4">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="flex-1 bg-transparent text-gray-200 text-sm focus:outline-none"
                    placeholder="住所を入力してください"
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin flex-shrink-0" />
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-2 bg-gray-800 border border-gray-600/50 rounded-xl shadow-2xl z-10 overflow-hidden"
                  >
                    {suggestions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionSelect(prediction);
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-700/70 transition-colors border-b border-gray-700/50 last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-gray-200 text-sm font-medium truncate">
                            {prediction.structured_formatting.main_text}
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            {prediction.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* タイトル */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            スポット名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 隠れ家カフェ「森の時間」"
            maxLength={50}
            className="w-full bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-gray-600/50 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none transition-all duration-200"
          />
        </div>

        {/* カテゴリ */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-300">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  category === cat
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 border border-gray-600/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 写真 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-300">写真</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={photoPreview} alt="プレビュー" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 w-full h-28 bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-dashed border-gray-600/50 hover:border-blue-500/50 rounded-2xl text-gray-400 hover:text-blue-400 transition-all duration-200"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="font-medium">写真を追加</span>
            </button>
          )}
        </div>

        {/* おすすめポイント */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3 text-gray-300">おすすめポイント</label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このスポットの魅力を教えてください..."
              rows={4}
              maxLength={200}
              className="w-full bg-gradient-to-br from-gray-800/60 to-gray-700/60 border border-gray-600/50 rounded-2xl px-4 py-3 text-white resize-none focus:border-gray-500 focus:outline-none transition-all duration-200"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {description.length}/200
            </div>
          </div>
        </div>

        {/* 送信エラー */}
        {submitError && (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-4 mb-6">
            <div className="text-red-300 text-sm">{submitError}</div>
          </div>
        )}

        {/* ボタン群 */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-gray-700/60 to-gray-600/60 hover:from-gray-600/60 hover:to-gray-500/60 text-white py-4 rounded-2xl transition-all duration-200 font-medium border border-gray-600/50"
          >
            キャンセル
          </button>

          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`flex-1 py-4 rounded-2xl transition-all duration-200 font-medium flex items-center justify-center space-x-2 ${
              isButtonDisabled
                ? "bg-gradient-to-r from-gray-600/50 to-gray-500/50 cursor-not-allowed text-gray-400 border border-gray-600/30"
                : "bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-500 hover:to-blue-600 text-white shadow-lg hover:shadow-slate-500/25 transform hover:scale-[1.02] border border-slate-500/30"
            }`}
          >
            {isSubmitting || isUploadingPhoto ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isUploadingPhoto ? "写真をアップロード中..." : "投稿中..."}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>投稿する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { atlasCellRect, atlasOverflow } from "./calibration";
import type { AtlasSliceSettings, CompanionImportKind } from "./model";

function formatTimecode(milliseconds: number): string {
  const seconds = Math.max(0, milliseconds) / 1000;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
}

function SourceImageCanvas({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    void createImageBitmap(file)
      .then((bitmap) => {
        try {
          if (!active) return;
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!canvas || !context) return;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          context.clearRect(0, 0, bitmap.width, bitmap.height);
          context.drawImage(bitmap, 0, 0);
        } finally {
          bitmap.close();
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [file]);
  return <canvas ref={canvasRef} aria-label={file.name} role="img" />;
}

export function SourceMediaPreview({
  file,
  kind,
  locale,
  videoRange,
  onVideoRangeChange,
  onVideoMetadata,
  onVideoStatus,
}: {
  file?: File;
  kind?: CompanionImportKind;
  locale: "en" | "zh-CN";
  videoRange?: { startMs: number; endMs: number };
  onVideoRangeChange: (range: { startMs: number; endMs: number }) => void;
  onVideoMetadata: (durationMs: number) => void;
  onVideoStatus: (status: "idle" | "loading" | "ready" | "unavailable") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [decodeError, setDecodeError] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  useEffect(() => {
    setDecodeError(false);
    setDurationMs(0);
    setCurrentTimeMs(0);
    if (!file) {
      onVideoStatus("idle");
      return;
    }
    if (kind !== "video") {
      onVideoStatus("idle");
      return;
    }
    onVideoStatus("loading");
    const video = videoRef.current;
    if (!video) return;
    const next = URL.createObjectURL(file);
    // The value is a freshly issued local blob URL for an allowlisted video
    // File, never DOM text, markup, a remote URL, or package-controlled data.
    video.src = next; // lgtm[js/xss-through-dom]
    video.load();
    return () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(next);
    };
  }, [file, kind]);
  return (
    <div
      className={
        kind === "video"
          ? "source-media-preview source-media-preview--video"
          : "source-media-preview"
      }
    >
      {!file ? (
        <span>{locale === "zh-CN" ? "尚未选择素材" : "No media selected"}</span>
      ) : kind === "video" ? (
        <>
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={(event) => {
              const nextDuration = event.currentTarget.duration * 1000;
              if (Number.isFinite(nextDuration) && nextDuration > 0) {
                setDurationMs(nextDuration);
                onVideoMetadata(nextDuration);
                onVideoStatus("ready");
              }
            }}
            onLoadedData={() => {
              setDecodeError(false);
              if (durationMs > 0) onVideoStatus("ready");
            }}
            onTimeUpdate={(event) =>
              setCurrentTimeMs(event.currentTarget.currentTime * 1000)
            }
            onError={() => {
              setDecodeError(true);
              setDurationMs(0);
              onVideoStatus("unavailable");
            }}
          />
          {durationMs > 0 && videoRange && (
            <div className="video-range-editor">
              <div className="video-range-editor__timecode">
                <strong>{formatTimecode(currentTimeMs)}</strong>
                <span>{formatTimecode(durationMs)}</span>
              </div>
              <div
                className="video-range-editor__track"
                style={
                  {
                    "--range-start": `${(videoRange.startMs / durationMs) * 100}%`,
                    "--range-end": `${(videoRange.endMs / durationMs) * 100}%`,
                    "--playhead": `${(currentTimeMs / durationMs) * 100}%`,
                  } as CSSProperties
                }
              >
                <i />
                <input
                  aria-label={
                    locale === "zh-CN" ? "视频入点" : "Video in point"
                  }
                  type="range"
                  min={0}
                  max={durationMs}
                  step={10}
                  value={videoRange.startMs}
                  onChange={(event) =>
                    onVideoRangeChange({
                      startMs: Math.min(
                        Number(event.target.value),
                        videoRange.endMs - 100,
                      ),
                      endMs: videoRange.endMs,
                    })
                  }
                />
                <input
                  aria-label={
                    locale === "zh-CN" ? "视频出点" : "Video out point"
                  }
                  type="range"
                  min={0}
                  max={durationMs}
                  step={10}
                  value={videoRange.endMs}
                  onChange={(event) =>
                    onVideoRangeChange({
                      startMs: videoRange.startMs,
                      endMs: Math.max(
                        Number(event.target.value),
                        videoRange.startMs + 100,
                      ),
                    })
                  }
                />
              </div>
              <div className="video-range-editor__actions">
                <button
                  type="button"
                  onClick={() =>
                    onVideoRangeChange({
                      startMs: Math.min(currentTimeMs, videoRange.endMs - 100),
                      endMs: videoRange.endMs,
                    })
                  }
                >
                  {locale === "zh-CN" ? "设为入点" : "Set in"}
                </button>
                <span>
                  {formatTimecode(videoRange.startMs)} –{" "}
                  {formatTimecode(videoRange.endMs)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onVideoRangeChange({
                      startMs: videoRange.startMs,
                      endMs: Math.max(currentTimeMs, videoRange.startMs + 100),
                    })
                  }
                >
                  {locale === "zh-CN" ? "设为出点" : "Set out"}
                </button>
              </div>
            </div>
          )}
          {decodeError && (
            <strong role="alert">
              {locale === "zh-CN"
                ? "系统视频引擎无法读取此文件，因此不会猜测时长或帧数。请转换为 H.264 MP4 后重试。"
                : "The system video engine cannot read this file, so duration and frame count will not be guessed. Convert it to H.264 MP4 and retry."}
            </strong>
          )}
        </>
      ) : (
        <SourceImageCanvas file={file} />
      )}
    </div>
  );
}

export function AtlasGridPreview({
  file,
  settings,
  locale,
  onDimensions,
}: {
  file?: File;
  settings: AtlasSliceSettings;
  locale: "en" | "zh-CN";
  onDimensions: (dimensions: { width: number; height: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!file) {
      setDimensions({ width: 0, height: 0 });
      onDimensions({ width: 0, height: 0 });
      return;
    }
    let active = true;
    void createImageBitmap(file)
      .then((bitmap) => {
        try {
          if (!active) return;
          const canvas = canvasRef.current;
          const context = canvas?.getContext("2d");
          if (!canvas || !context) return;
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          context.clearRect(0, 0, bitmap.width, bitmap.height);
          context.drawImage(bitmap, 0, 0);
          const nextDimensions = {
            width: bitmap.width,
            height: bitmap.height,
          };
          setDimensions(nextDimensions);
          onDimensions(nextDimensions);
        } finally {
          bitmap.close();
        }
      })
      .catch(() => {
        if (active) {
          setDimensions({ width: 0, height: 0 });
          onDimensions({ width: 0, height: 0 });
        }
      });
    return () => {
      active = false;
    };
  }, [file, onDimensions]);
  const overflow = new Set(
    atlasOverflow(dimensions.width, dimensions.height, settings),
  );
  return (
    <div className="atlas-grid-preview">
      {file ? (
        <canvas ref={canvasRef} aria-label="Decoded sprite atlas source" />
      ) : (
        <span>
          {locale === "zh-CN"
            ? "选择图集后将在这里预览切割网格。"
            : "Select an atlas image to preview its grid."}
        </span>
      )}
      {dimensions.width > 0 &&
        Array.from(
          { length: Math.min(512, settings.columns * settings.rows) },
          (_, index) => {
            const rect = atlasCellRect(index, settings);
            return (
              <i
                key={index}
                className={overflow.has(index) ? "is-overflow" : ""}
                style={{
                  left: `${(rect.x / dimensions.width) * 100}%`,
                  top: `${(rect.y / dimensions.height) * 100}%`,
                  width: `${(rect.width / dimensions.width) * 100}%`,
                  height: `${(rect.height / dimensions.height) * 100}%`,
                }}
              >
                {index + 1}
              </i>
            );
          },
        )}
      {overflow.size > 0 && (
        <strong role="alert">
          {locale === "zh-CN"
            ? `${overflow.size} 个单元格超出源图范围。`
            : `${overflow.size} cells exceed the source image.`}
        </strong>
      )}
    </div>
  );
}

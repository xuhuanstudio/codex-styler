import { CirclePlay, MousePointer2, Pause } from "lucide-react";
import type { MotionAuditionPlan } from "./motions";

const copy = {
  en: {
    title: "Behavior audition",
    currentDirection: "Direction sector",
    description:
      "Runtime only plays idle motions assigned to the direction currently facing the pointer.",
    motion: "Saved idle motion",
    noPose: "No calibrated direction is available at this pointer position.",
    noMotion: "No idle motion is assigned to this direction.",
    noMotionHelp:
      "Move the pointer to another direction, or edit pose assignments in Motions.",
    play: "Play idle motion",
    stop: "Stop preview",
    interrupt: "Moving the pointer interrupts playback, just like runtime.",
    frame: "anchor frame",
    frames: "frames",
    fallbackName: "Idle motion",
    playing: "Playing",
    ready: "Ready to preview",
  },
  "zh-CN": {
    title: "行为联调",
    currentDirection: "方向区间",
    description: "运行时只会播放与当前光标方向姿态关联的空闲动作。",
    motion: "已保存的小动作",
    noPose: "当前光标位置没有可用的方向姿态。",
    noMotion: "当前方向尚未关联小动作。",
    noMotionHelp: "移动光标切换方向，或返回“小动作”调整姿态关联。",
    play: "播放小动作",
    stop: "停止预览",
    interrupt: "移动光标会立即中断动作，与实际运行时一致。",
    frame: "锚点帧",
    frames: "帧",
    fallbackName: "空闲动作",
    playing: "正在播放",
    ready: "可预览",
  },
} as const;

export function BehaviorAudition({
  locale,
  plan,
  selectedMotionId,
  playing,
  onSelect,
  onToggle,
}: {
  locale: "en" | "zh-CN";
  plan: MotionAuditionPlan;
  selectedMotionId: string | null;
  playing: boolean;
  onSelect: (motionId: string) => void;
  onToggle: () => void;
}) {
  const c = copy[locale];
  const selectedMotion =
    plan.motions.find((motion) => motion.id === selectedMotionId) ??
    plan.motions[0] ??
    null;
  const poseSummary = plan.activeAnchor
    ? `${Math.round(plan.activeAnchor.angle)}° · ${c.frame} ${plan.activeAnchor.frameIndex + 1}`
    : "—";

  return (
    <section
      className="creator-behavior-audition"
      aria-labelledby="behavior-audition-title"
    >
      <div className="creator-behavior-audition__heading">
        <span className="creator-behavior-audition__icon" aria-hidden="true">
          <MousePointer2 size={15} />
        </span>
        <div>
          <h3 id="behavior-audition-title">{c.title}</h3>
          <p>{c.description}</p>
        </div>
        <span className="creator-behavior-audition__pose">
          <small>{c.currentDirection}</small>
          <strong>{poseSummary}</strong>
        </span>
      </div>

      {!plan.activeAnchor ? (
        <div className="creator-behavior-audition__empty">{c.noPose}</div>
      ) : plan.motions.length === 0 ? (
        <div className="creator-behavior-audition__empty">
          <strong>{c.noMotion}</strong>
          <span>{c.noMotionHelp}</span>
        </div>
      ) : (
        <>
          <div className="creator-behavior-audition__controls">
            <label className="creator-behavior-audition__field">
              <span>{c.motion}</span>
              <span className="creator-select-control">
                <select
                  value={selectedMotion?.id ?? ""}
                  onChange={(event) => onSelect(event.target.value)}
                >
                  {plan.motions.map((motion) => (
                    <option key={motion.id} value={motion.id}>
                      {motion.name || c.fallbackName}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <button
              type="button"
              className={`button${playing ? "" : " button--primary"}`}
              onClick={onToggle}
              disabled={!selectedMotion}
            >
              {playing ? <Pause size={16} /> : <CirclePlay size={16} />}
              {playing ? c.stop : c.play}
            </button>
          </div>
          {selectedMotion && (
            <div
              className="creator-behavior-audition__status"
              aria-live="polite"
            >
              <span>
                {playing ? `${c.playing}: ` : `${c.ready}: `}
                <strong>{selectedMotion.name || c.fallbackName}</strong>
              </span>
              <span>
                {selectedMotion.frames.length} {c.frames} ·{" "}
                {(selectedMotion.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
          )}
          <p className="creator-behavior-audition__hint">{c.interrupt}</p>
        </>
      )}
    </section>
  );
}

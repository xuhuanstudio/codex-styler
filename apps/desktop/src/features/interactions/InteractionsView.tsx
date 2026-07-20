import {
  CircleOff,
  Dices,
  Gauge,
  Gamepad2,
  Orbit,
  Route,
  ScanSearch,
} from "lucide-react";
import type { ReactNode } from "react";
import type { KeyboardEvent } from "react";
import type { MessageKey } from "../../lib/i18n";
import type { ComposerInteractionMode } from "../../lib/composer-interactions";

export interface InteractionsViewProps {
  mode: ComposerInteractionMode;
  t: (key: MessageKey) => string;
  onChange: (mode: ComposerInteractionMode) => void;
}

const modes: Array<{
  id: ComposerInteractionMode;
  name: MessageKey;
  description: MessageKey;
  category: MessageKey;
  icon: ReactNode;
}> = [
  {
    id: "disabled",
    name: "interactionDisabled",
    description: "interactionDisabledDetail",
    category: "interactionCategoryOfficial",
    icon: <CircleOff size={19} />,
  },
  {
    id: "marbles",
    name: "interactionMarbles",
    description: "interactionMarblesDetail",
    category: "interactionCategoryPhysics",
    icon: <Orbit size={19} />,
  },
  {
    id: "claw",
    name: "interactionClaw",
    description: "interactionClawDetail",
    category: "interactionCategorySkill",
    icon: <ScanSearch size={19} />,
  },
  {
    id: "toss",
    name: "interactionToss",
    description: "interactionTossDetail",
    category: "interactionCategoryChance",
    icon: <Dices size={19} />,
  },
  {
    id: "balance",
    name: "interactionBalance",
    description: "interactionBalanceDetail",
    category: "interactionCategoryTune",
    icon: <Gauge size={19} />,
  },
  {
    id: "route",
    name: "interactionRoute",
    description: "interactionRouteDetail",
    category: "interactionCategoryChoose",
    icon: <Route size={19} />,
  },
];

function moveModeSelection(
  event: KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  onChange: (mode: ComposerInteractionMode) => void,
) {
  let nextIndex: number | null = null;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % modes.length;
  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + modes.length) % modes.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = modes.length - 1;
  }
  if (nextIndex === null) return;

  event.preventDefault();
  onChange(modes[nextIndex].id);
  const options =
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(
      '[role="option"]',
    );
  options?.[nextIndex]?.focus();
}

export function InteractionsView({ mode, t, onChange }: InteractionsViewProps) {
  const selected = modes.find((item) => item.id === mode) ?? modes[0];

  return (
    <div className="page interactions-page">
      <section className="page-heading interactions-heading">
        <div>
          <span className="page-kicker">{t("interactionKicker")}</span>
          <h1>{t("interactions")}</h1>
          <p>{t("interactionDescription")}</p>
        </div>
      </section>

      <section className="interactions-workspace">
        <div
          className="interaction-mode-list"
          role="listbox"
          aria-label={t("interactionChooseMode")}
        >
          {modes.map((item, index) => {
            const active = item.id === selected.id;
            return (
              <button
                key={item.id}
                type="button"
                className={
                  active ? "interaction-mode is-selected" : "interaction-mode"
                }
                role="option"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => onChange(item.id)}
                onKeyDown={(event) => moveModeSelection(event, index, onChange)}
              >
                <span className="interaction-mode__icon">{item.icon}</span>
                <span className="interaction-mode__copy">
                  <small>{t(item.category)}</small>
                  <strong>{t(item.name)}</strong>
                  <span>{t(item.description)}</span>
                </span>
                <span className="interaction-mode__state">
                  {active ? t("interactionSelected") : ""}
                </span>
              </button>
            );
          })}
        </div>

        <article className="interaction-detail">
          <header className="interaction-detail__header">
            <span className="interaction-detail__icon">{selected.icon}</span>
            <div>
              <small>{t(selected.category)}</small>
              <h2>{t(selected.name)}</h2>
              <p>{t(selected.description)}</p>
            </div>
          </header>

          <div
            className="interaction-placement"
            aria-label={t("interactionNativePlacement")}
          >
            <div className="interaction-placement__composer">
              <span>{t("interactionComposerPlaceholder")}</span>
              <div className="interaction-placement__control">
                <Gamepad2 size={16} />
                <strong>
                  {selected.id === "disabled"
                    ? t("interactionOfficialControl")
                    : t(selected.name)}
                </strong>
              </div>
            </div>
            <div className="interaction-placement__caption">
              <strong>{t("interactionNativePlacement")}</strong>
              <span>{t("interactionNativePlacementDetail")}</span>
            </div>
          </div>

          <dl className="interaction-assurances">
            <div>
              <dt>{t("interactionSafetyTitle")}</dt>
              <dd>{t("interactionSafetyDetail")}</dd>
            </div>
            <div>
              <dt>{t("interactionFallbackTitle")}</dt>
              <dd>{t("interactionFallbackDetail")}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}

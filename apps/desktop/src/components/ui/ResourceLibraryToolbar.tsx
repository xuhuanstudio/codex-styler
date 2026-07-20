import {
  LibrarySearchField,
  type LibrarySearchFieldProps,
} from "./LibrarySearchField";

export interface ResourceLibraryTab<TabId extends string> {
  id: TabId;
  label: string;
  count: number;
}

export interface ResourceLibraryToolbarProps<TabId extends string> {
  ariaLabel: string;
  tabs: ResourceLibraryTab<TabId>[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  search?: LibrarySearchFieldProps;
  className?: string;
}

export function ResourceLibraryToolbar<TabId extends string>({
  ariaLabel,
  tabs,
  activeTab,
  onTabChange,
  search,
  className,
}: ResourceLibraryToolbarProps<TabId>) {
  return (
    <div
      className={["resource-library-toolbar", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="theme-collection-tabs"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            <small>{tab.count}</small>
          </button>
        ))}
      </div>
      {search && <LibrarySearchField {...search} />}
    </div>
  );
}

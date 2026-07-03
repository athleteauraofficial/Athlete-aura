import { SlidersHorizontal } from "lucide-react";
import styles from "./discover.module.css";

export default function DiscoverSearch({
  value,
  onChange,
  filtersOpen,
  onFilterToggle,
  activeFilterCount,
}) {
  return (
    <div className={styles.search}>
      <label className={styles.searchInput}>
        <span className={styles.srOnly}>Search athletes</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name, sport, position, country, or club"
        />
      </label>
      <button
        aria-expanded={filtersOpen}
        aria-label="Show athlete filters"
        className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleActive : ""}`}
        title="Filters"
        type="button"
        onClick={onFilterToggle}
      >
        <SlidersHorizontal aria-hidden="true" size={20} strokeWidth={2.2} />
        {activeFilterCount > 0 && (
          <span className={styles.filterCount}>{activeFilterCount}</span>
        )}
      </button>
    </div>
  );
}

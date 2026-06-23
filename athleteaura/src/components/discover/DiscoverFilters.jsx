import styles from "./discover.module.css";

export default function DiscoverFilters({
  fields,
  options,
  values,
  onChange,
  onReset,
}) {
  const hasActiveFilters = fields.some(({ field }) => values[field]);

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHead}>
        <span className={styles.filtersLabel}>Filter by</span>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={onReset}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className={styles.filterControls}>
        {fields.map(({ field, label }) => (
          <label className={styles.filter} key={field}>
            <span className={styles.srOnly}>{label}</span>
            <select
              value={values[field]}
              onChange={(event) => onChange(field, event.target.value)}
            >
              <option value="">Any {label.toLowerCase()}</option>
              {(options[field] ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

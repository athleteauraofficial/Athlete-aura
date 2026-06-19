import styles from "./discover.module.css";

export default function DiscoverSearch({ value, onChange }) {
  return (
    <label className={styles.search}>
      <span className={styles.srOnly}>Search athletes</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name, sport, position, country, or club"
      />
    </label>
  );
}

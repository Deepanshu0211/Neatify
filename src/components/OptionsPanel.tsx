type OptionsPanelProps = {
  method: string;
  setMethod: (method: string) => void;
};

export default function OptionsPanel({}: OptionsPanelProps) {
  return (
    <div className="organizing-options">
      <div className="option-grid">
        {/* File Type Option */}
        <div className="relative group">
          <button className="sort-option active-option">
            <span aria-hidden="true">▦</span>
            <span>By file type</span>
          </button>
          {/* Active Badge */}
          <span className="option-badge active-badge">Active</span>
        </div>

        {/* AI Suggestions Option */}
        <div className="relative group">
          <button className="sort-option muted-option">
            <span aria-hidden="true">✦</span>
            <span>AI suggestions</span>
          </button>
          {/* Hover-only Coming Soon Badge */}
          <span className="option-badge soon-badge">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

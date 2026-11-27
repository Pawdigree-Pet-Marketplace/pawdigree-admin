import { REPORT_TABS } from "./reportTypes";
import type { ReportTab } from "./reportTypes";
import "./Reports.css";

interface ReportsTabsProps {
  activeTab: ReportTab["id"];
  onTabChange: (tab: ReportTab["id"]) => void;
}

const ReportsTabs = ({ activeTab, onTabChange }: ReportsTabsProps) => {
  return (
    <div className="reports-tabs" role="tablist" aria-label="Report categories">
      {REPORT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`reports-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ReportsTabs;
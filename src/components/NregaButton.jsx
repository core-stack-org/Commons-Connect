import useMainStore from "../store/MainStore.jsx";
import { useTranslation } from "react-i18next";

const NregaButton = () => {
  const { t } = useTranslation();
  const MainStore = useMainStore((state) => state);

  const handleNregaSheet = () => {
    MainStore.setNregaSheet(true);
    MainStore.setIsOpen(true);
  };

  return (
    <button
      className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm h-9"
      style={{
        backgroundColor: "#D6D5C9",
        color: "#592941",
        border: "none",
        backdropFilter: "none",
      }}
      onClick={handleNregaSheet}
    >
      {t("NREGA Works")}
    </button>
  );
};

export default NregaButton;
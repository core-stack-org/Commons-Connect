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
      type="button"
      className="flex-shrink-0 px-3 py-2 rounded-xl shadow-sm text-sm h-9 bg-sand text-plum whitespace-nowrap active:scale-95 transition-transform"
      onClick={handleNregaSheet}
    >
      {t("NREGA Works")}
    </button>
  );
};

export default NregaButton;

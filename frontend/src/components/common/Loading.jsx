import { useSettings } from '../../context/SettingsContext';

const Loading = () => {
  const { settings } = useSettings();

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-6">
        <h1 className="font-display-lg text-headline-sm tracking-[0.3em] text-on-surface animate-pulse">{settings.site_name}</h1>
        <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;

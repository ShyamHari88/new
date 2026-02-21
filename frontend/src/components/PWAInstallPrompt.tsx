import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS (Safari doesn't support beforeinstallprompt)
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setIsIOS(ios);

        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) return;

        if (ios) {
            // Show iOS-specific instructions after 3s
            setTimeout(() => setShowBanner(true), 3000);
        }

        // Android/Desktop – listen for native prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowBanner(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const result = await installPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setShowBanner(false);
            setIsInstalled(true);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', '1');
    };

    if (isInstalled || !showBanner) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 80,
                left: 12,
                right: 12,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                borderRadius: '1.2rem',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
                animation: 'slideUp 0.4s ease-out',
                color: '#fff',
            }}
        >
            {/* Icon */}
            <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Download size={20} />
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                    Install ClassConnect
                </p>
                {isIOS ? (
                    <p style={{ fontSize: 10, opacity: 0.75, margin: '3px 0 0', lineHeight: 1.4 }}>
                        Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
                    </p>
                ) : (
                    <p style={{ fontSize: 10, opacity: 0.75, margin: '3px 0 0' }}>
                        Add to home screen — works offline
                    </p>
                )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!isIOS && installPrompt && (
                    <button
                        onClick={handleInstall}
                        style={{
                            background: '#fff', color: '#2563eb',
                            border: 'none', borderRadius: 8, padding: '6px 14px',
                            fontWeight: 800, fontSize: 10, cursor: 'pointer',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}
                    >
                        Install
                    </button>
                )}
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none', borderRadius: 8, padding: '6px 8px',
                        cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center',
                    }}
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

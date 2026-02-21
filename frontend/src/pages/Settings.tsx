import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, ShieldCheck, Smartphone, Laptop, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { checkPushSubscriptionStatus, requestNotificationPermission, unsubscribeUserFromPush } from "@/lib/push-notifications";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const Settings = () => {
    const [status, setStatus] = useState<'subscribed' | 'unsubscribed' | 'blocked' | 'unsupported'>('unsupported');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const currentStatus = await checkPushSubscriptionStatus();
        setStatus(currentStatus);
        setLoading(false);
    };

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        if (checked) {
            const success = await requestNotificationPermission();
            if (success) {
                toast.success("Notifications enabled!", {
                    description: "You will now receive native alerts on this device."
                });
                setStatus('subscribed');
            } else {
                toast.error("Permission denied", {
                    description: "Please check your browser notification settings."
                });
                setStatus('blocked');
            }
        } else {
            const success = await unsubscribeUserFromPush();
            if (success) {
                toast.success("Notifications disabled");
                setStatus('unsubscribed');
            }
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 pb-24">
            <Card className="w-full max-w-4xl mx-auto backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 md:p-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Smartphone className="h-8 w-8" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl md:text-3xl font-bold">App Settings</CardTitle>
                            <p className="text-blue-100 mt-1 opacity-90 text-sm">Configure your app experience</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-10">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Bell className="h-5 w-5 text-blue-600" />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white mb-1">Push Notifications</p>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            Receive native alerts for attendance, marks, and leave updates even when the app is closed.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={status === 'subscribed'}
                                        onCheckedChange={handleToggle}
                                        disabled={loading || status === 'unsupported'}
                                    />
                                </div>

                                {status === 'subscribed' && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-none font-bold text-[10px] h-9 rounded-xl"
                                            onClick={async () => {
                                                try {
                                                    const api = (await import('@/services/api')).default;
                                                    await api.post('/notifications/test-push');
                                                    toast.success("Test triggering...", { description: "Check your lock screen in 2 seconds." });
                                                } catch (e) {
                                                    toast.error("Failed to send test. Try refreshing.");
                                                }
                                            }}
                                        >
                                            <Bell className="h-3 w-3 mr-2" />
                                            SEND TEST NOTIFICATION
                                        </Button>
                                    </div>
                                )}

                                {status === 'blocked' && (
                                    <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-medium leading-relaxed">
                                            Notification permission is blocked. Please reset site permissions in your browser settings to enable alerts.
                                        </p>
                                    </div>
                                )}

                                {status === 'unsupported' && (
                                    <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-[10px] font-medium leading-relaxed">
                                        <AlertCircle className="h-4 w-4 inline mr-2 text-amber-500" />
                                        Your browser or connection (HTTP) doesn't support native notifications. Please use HTTPS or a modern browser like Chrome/Safari.
                                    </div>
                                )}
                            </div>

                            {/* Mobile Troubleshooting Tips */}
                            <div className="mt-6 space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Mobile Tips</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-800 mb-1">🍎 iOS User?</p>
                                        <ul className="text-[9px] text-slate-500 space-y-1">
                                            <li>• Use **Add to Home Screen** (Share menu)</li>
                                            <li>• Ensure iOS version is 16.4+</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-800 mb-1">🤖 Android User?</p>
                                        <ul className="text-[9px] text-slate-500 space-y-1">
                                            <li>• Use **Chrome** for best results</li>
                                            <li>• Turn off 'Battery Saver' for alerts</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Privacy & Security</h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Biometric Lock</p>
                                            <p className="text-[10px] text-slate-500">Secure the app with Fingerprint or FaceID</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">SOON</div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Button variant="outline" className="w-full justify-start gap-2 h-11 rounded-xl text-slate-700 font-bold text-xs" disabled>
                                            <Laptop className="h-4 w-4" />
                                            Active Sessions
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">ClassConnect Version 1.2.0 • Build 2026.02</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;

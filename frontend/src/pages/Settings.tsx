import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Settings = () => {
    return (
        <div className="container mx-auto p-6">
            <Card className="w-full max-w-4xl mx-auto backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
                    <CardTitle className="text-3xl font-bold">Settings</CardTitle>
                    <p className="text-blue-100 mt-2">Manage your account and application preferences</p>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        <div className="border-b pb-6">
                            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Account Settings</h3>
                            <p className="text-slate-600 dark:text-slate-400">Settings related to your user account and profile.</p>
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-sm italic">Account settings functionality is coming soon.</p>
                            </div>
                        </div>

                        <div className="border-b pb-6">
                            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">System Preferences</h3>
                            <p className="text-slate-600 dark:text-slate-400">Configure how the application behaves and looks.</p>
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-sm italic">System preferences will be available in the next update.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Notifications</h3>
                            <p className="text-slate-600 dark:text-slate-400">Manage how you receive alerts and updates.</p>
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-sm italic">Notification controls are currently under development.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;

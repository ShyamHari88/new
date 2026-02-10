
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
    open: boolean;
    onSuccess: () => void;
}

export function ChangePasswordDialog({ open, onSuccess }: ChangePasswordDialogProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Password updated successfully');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Security Update Required</DialogTitle>
                    <DialogDescription>
                        This is your first login. For security reasons, you must update your password before proceeding.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                            id="current"
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                            id="new"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                            id="confirm"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

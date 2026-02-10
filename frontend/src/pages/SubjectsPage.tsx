import { SubjectManager } from '@/components/teacher/SubjectManager';

export default function SubjectsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Manage Subjects</h1>
                <p className="mt-1 text-muted-foreground">
                    Add and manage subjects for your classes
                </p>
            </div>

            <SubjectManager />
        </div>
    );
}
